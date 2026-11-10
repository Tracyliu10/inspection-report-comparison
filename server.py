#!/usr/bin/env python3
"""Inspection Report Comparison: dependency-free collaboration server."""
import os, json, sqlite3, secrets, hashlib, hmac, time, base64, re, mimetypes, io, zipfile, html
from pathlib import Path
from datetime import date
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from http.cookies import SimpleCookie
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('IRC_DATA_DIR', ROOT / 'data'))
DEMO = os.environ.get('IRC_DEMO', '0') == '1'
SECURE = os.environ.get('IRC_SECURE_COOKIE', '0') == '1'
STATES = ['草稿', '待审核', '退回补充', '已完成']
DECISIONS = ['待审核','租客责任','原有问题','合理损耗','维修跟进','证据不足']

def connect():
    c = sqlite3.connect(DATA / 'app.sqlite3', timeout=20)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def password_hash(p, salt=None):
    salt = salt or secrets.token_hex(16)
    return salt + ':' + hashlib.pbkdf2_hmac('sha256', p.encode(), salt.encode(), 240000).hex()

def verify(p, stored):
    return hmac.compare_digest(password_hash(p, stored.split(':')[0]), stored)

def public_user(u):
    return {k:u[k] for k in ('id','name','role','email','active')}

def init():
    DATA.mkdir(parents=True, exist_ok=True)
    with connect() as c:
        c.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,role TEXT,password TEXT,active INTEGER DEFAULT 1);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,csrf TEXT,expires REAL,FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY,address TEXT,current TEXT,previous TEXT,junior_id TEXT,cm_id TEXT,status TEXT,version INTEGER DEFAULT 1,items TEXT,return_note TEXT DEFAULT '',updated REAL,FOREIGN KEY(junior_id) REFERENCES users(id),FOREIGN KEY(cm_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS deleted_cases(case_id TEXT PRIMARY KEY REFERENCES cases(id), deleted_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,case_id TEXT,data BLOB,mime TEXT,FOREIGN KEY(case_id) REFERENCES cases(id));
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,case_id TEXT,user_id TEXT,event TEXT,detail TEXT,created REAL);
        CREATE TABLE IF NOT EXISTS archives(token TEXT PRIMARY KEY,case_id TEXT,version INTEGER,sha256 TEXT,created REAL,cleaned REAL,location TEXT);
        CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER,until REAL);
        ''')
        if not c.execute('SELECT 1 FROM users LIMIT 1').fetchone():
            p = 'Test-Only-2026!' if DEMO else os.environ.get('IRC_ADMIN_PASSWORD')
            if not p or len(p)<8:
                raise SystemExit('首次启动请设置至少8位的 IRC_ADMIN_PASSWORD；测试可使用 IRC_DEMO=1。')
            users = [('admin','管理员','admin@example.test','admin')]
            if DEMO:
                users += [(f'j{i}', f'Junior {i}',f'junior{i}@example.test','junior') for i in range(1,4)]
                users += [(f'c{i}', f'CM {i}',f'cm{i}@example.test','cm') for i in range(1,9)]
            for uid,name,email,role in users:
                c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,name,email,role,password_hash(p)))
            if DEMO:
                for n,j,cm,status in [(1,'j1','c1','草稿'),(2,'j2','c2','待审核'),(3,'j3','c3','退回补充')]:
                    i = {'id':secrets.token_hex(8),'area':'Kitchen','item':'抽油烟机','kind':'清洁','description':'演示项目：表面油渍，请添加同位置前后照片。','before':[],'after':[],'junior':'仅为虚构测试资料','finding':'待核实','decision':'待审核','cm':'','amount':''}
                    c.execute('INSERT INTO cases VALUES(?,?,?,?,?,?,?,1,?,?,?)',(f'demo{n}',f'演示房源 0{n} · 请勿作为真实证据','2026-08-21','',j,cm,status,json.dumps([i],ensure_ascii=False),'请补充之前同位置照片' if n==3 else '',time.time()))

def can_read(u,case):
    return u['role']=='admin' or u['role']=='junior' and case['junior_id']==u['id'] or u['role']=='cm' and case['cm_id']==u['id']

def audit(c, case_id, uid, event, detail=''):
    c.execute('INSERT INTO audit(case_id,user_id,event,detail,created) VALUES(?,?,?,?,?)',(case_id,uid,event,detail,time.time()))

def case_json(r):
    d=dict(r);d['items']=json.loads(d['items']);return d

class APIError(Exception):
    def __init__(self,code,message): self.code,self.message=code,message

class Handler(BaseHTTPRequestHandler):
    server_version='InspectionComparison/2'
    def log_message(self,fmt,*args): pass
    def output(self,code,data,content_type='application/json; charset=utf-8',cookie=None):
        payload=json.dumps(data,ensure_ascii=False).encode() if content_type.startswith('application/json') else data
        self.send_response(code)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(payload)))
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','same-origin')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Frame-Options','DENY')
        if cookie:self.send_header('Set-Cookie',cookie)
        self.end_headers();self.wfile.write(payload)
    def body(self):
        n=int(self.headers.get('Content-Length','0'))
        if n>6*1024*1024:raise APIError(413,'请求过大，请压缩图片后重试')
        try:return json.loads(self.rfile.read(n)) if n else {}
        except (ValueError,UnicodeDecodeError):raise APIError(400,'JSON 格式不正确')
    def auth(self,c,mutation=False):
        cookies=SimpleCookie();cookies.load(self.headers.get('Cookie',''))
        token=cookies.get('irc_session')
        session=c.execute('SELECT * FROM sessions WHERE token=? AND expires>?',(token.value if token else '',time.time())).fetchone()
        if not session:raise APIError(401,'请先登录')
        u=c.execute('SELECT * FROM users WHERE id=? AND active=1',(session['user_id'],)).fetchone()
        if not u:raise APIError(401,'账号已停用，请联系管理员')
        if mutation and not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),session['csrf']):raise APIError(403,'安全校验失败，请刷新后重试')
        return u,session
    def case(self,c,cid,u):
        r=c.execute('SELECT * FROM cases WHERE id=? AND id NOT IN (SELECT case_id FROM deleted_cases)',(cid,)).fetchone()
        if not r or not can_read(u,r):raise APIError(404,'案件不存在或无权访问')
        return r
    def version(self,b,r):
        if b.get('version')!=r['version']:raise APIError(409,'案件已被其他人更新，请刷新案件后重新编辑；当前输入仍保留在页面中')
    def bump(self,c,cid,**fields):
        fields['updated']=time.time()
        c.execute('UPDATE cases SET '+','.join(k+'=?' for k in fields)+',version=version+1 WHERE id=?',(*fields.values(),cid))
    def do_GET(self): self.dispatch(False)
    def do_POST(self): self.dispatch(True)
    def dispatch(self,mutation):
        try:
            p=urlparse(self.path).path
            if not p.startswith('/api/'):
                if mutation:raise APIError(404,'接口不存在')
                filename={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'}.get(p)
                if not filename:raise APIError(404,'页面不存在')
                f=ROOT/'static'/filename
                return self.output(200,f.read_bytes(),mimetypes.guess_type(f)[0]+('; charset=utf-8' if f.suffix in ['.html','.js','.css'] else ''))
            b=self.body() if mutation else {}
            with connect() as c:
                # Reserve the writer lock before reading versions: concurrent edits cannot both pass.
                if mutation:c.execute('BEGIN IMMEDIATE')
                if p=='/api/config' and not mutation:return self.output(200,{'demo':DEMO})
                if p=='/api/login' and mutation:
                    email=str(b.get('email','')).strip().lower();pw=str(b.get('password',''))
                    key=self.client_address[0]; now=time.time()
                    a=c.execute('SELECT * FROM attempts WHERE key=?',(key,)).fetchone()
                    if a and a['until']>now and a['count']>=20:raise APIError(429,'登录尝试过多，请15分钟后重试')
                    u=c.execute('SELECT * FROM users WHERE email=? AND active=1',(email,)).fetchone()
                    if not u or not verify(pw,u['password']):
                        count=a['count']+1 if a and a['until']>now else 1
                        c.execute('INSERT OR REPLACE INTO attempts VALUES(?,?,?)',(key,count,now+900));c.commit()
                        raise APIError(401,'邮箱或密码错误')
                    c.execute('DELETE FROM attempts WHERE key=?',(key,))
                    token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(24)
                    c.execute('DELETE FROM sessions WHERE expires<?',(now,))
                    c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(token,u['id'],csrf,now+43200));c.commit()
                    return self.output(200,{'user':public_user(u),'csrf':csrf},cookie=f'irc_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200'+('; Secure' if SECURE else ''))
                u,session=self.auth(c,mutation)
                if p=='/api/me' and not mutation:return self.output(200,{'user':public_user(u),'csrf':session['csrf']})
                if p=='/api/logout' and mutation:
                    c.execute('DELETE FROM sessions WHERE token=?',(session['token'],));c.commit()
                    return self.output(200,{},cookie='irc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
                if p=='/api/password' and mutation:
                    new=str(b.get('password',''))
                    if not verify(str(b.get('old','')),u['password']):raise APIError(400,'当前密码不正确')
                    if len(new)<8:raise APIError(400,'新密码至少8位')
                    c.execute('UPDATE users SET password=? WHERE id=?',(password_hash(new),u['id']))
                    c.execute('DELETE FROM sessions WHERE user_id=? AND token<>?',(u['id'],session['token']));c.commit()
                    return self.output(200,{})
                if p=='/api/users':
                    if mutation:
                        if u['role']!='admin':raise APIError(403,'仅管理员可维护账号')
                        email=str(b.get('email','')).strip().lower();name=str(b.get('name','')).strip();role=b.get('role');pw=str(b.get('password',''))
                        if not name or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email) or role not in ['junior','cm','admin'] or len(pw)<8:raise APIError(400,'请输入姓名、有效邮箱、角色及至少8位初始密码')
                        try:c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(secrets.token_hex(12),name,email,role,password_hash(pw)))
                        except sqlite3.IntegrityError:raise APIError(400,'该邮箱已存在')
                        audit(c,None,u['id'],'创建账号',email);c.commit()
                    users=c.execute('SELECT * FROM users ORDER BY role,name').fetchall()
                    # Non-admins receive only their own profile and assigned colleagues.
                    if u['role']!='admin':
                        ids={u['id']}
                        for row in c.execute('SELECT * FROM cases WHERE id NOT IN (SELECT case_id FROM deleted_cases)'):
                            if can_read(u,row):ids.update([row['junior_id'],row['cm_id']])
                        users=[v for v in users if v['id'] in ids or u['role']=='junior' and v['role']=='cm' and v['active']]
                    return self.output(200,{'users':[public_user(v) for v in users]})
                m=re.fullmatch('/api/users/([^/]+)/edit',p)
                if m and mutation:
                    if u['role']!='admin':raise APIError(403,'仅管理员可编辑账号')
                    target=c.execute('SELECT * FROM users WHERE id=?',(m[1],)).fetchone()
                    if not target:raise APIError(404,'账号不存在')
                    name=str(b.get('name','')).strip();email=str(b.get('email','')).strip().lower();pw=str(b.get('password',''))
                    if not name or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email):raise APIError(400,'请输入姓名及有效邮箱')
                    if pw and len(pw)<8:raise APIError(400,'新密码至少8位；留空保留原密码')
                    try:c.execute('UPDATE users SET name=?,email=?,password=? WHERE id=?',(name,email,password_hash(pw) if pw else target['password'],target['id']))
                    except sqlite3.IntegrityError:raise APIError(400,'该邮箱已被其他账号使用')
                    if pw or email!=target['email']:
                        c.execute('DELETE FROM sessions WHERE user_id=? AND token<>?',(target['id'],session['token']))
                    audit(c,None,u['id'],'编辑账号',json.dumps({'user_id':target['id'],'name':name,'email':email,'password_reset':bool(pw)},ensure_ascii=False));c.commit()
                    return self.output(200,{'user':public_user(c.execute('SELECT * FROM users WHERE id=?',(target['id'],)).fetchone())})
                m=re.fullmatch('/api/users/([^/]+)/status',p)
                if m and mutation:
                    if u['role']!='admin':raise APIError(403,'仅管理员可停用账号')
                    if m[1]==u['id']:raise APIError(400,'不能停用自己的账号')
                    active=1 if b.get('active') else 0
                    c.execute('UPDATE users SET active=? WHERE id=?',(active,m[1]));c.execute('DELETE FROM sessions WHERE user_id=?',(m[1],));audit(c,None,u['id'],'启停账号',m[1]);c.commit();return self.output(200,{})
                if p=='/api/cases':
                    if mutation:
                        if u['role'] not in ['admin','junior']:raise APIError(403,'仅管理员或Junior可创建案件')
                        if u['role']=='junior':b['junior_id']=u['id']
                        addr=str(b.get('address','')).strip()
                        if not addr:raise APIError(400,'请填写物业地址')
                        self.assign_valid(c,b)
                        cid=secrets.token_hex(12)
                        c.execute('INSERT INTO cases VALUES(?,?,?,?,?,?,?,1,?,?,?)',(cid,addr,b.get('current',''),b.get('previous',''),b['junior_id'],b['cm_id'],'草稿','[]','',time.time()))
                        audit(c,cid,u['id'],'创建并分配',addr);c.commit()
                        return self.output(201,case_json(c.execute('SELECT * FROM cases WHERE id=?',(cid,)).fetchone()))
                    return self.output(200,{'cases':[case_json(r) for r in c.execute('SELECT * FROM cases WHERE id NOT IN (SELECT case_id FROM deleted_cases) ORDER BY updated DESC') if can_read(u,r)]})
                m=re.fullmatch('/api/media/([^/]+)',p)
                if m and not mutation:
                    r=c.execute('SELECT * FROM media WHERE id=?',(m[1],)).fetchone()
                    if not r:raise APIError(404,'照片不存在')
                    self.case(c,r['case_id'],u)
                    return self.output(200,r['data'],r['mime'])
                m=re.fullmatch('/api/cases/([^/]+)(?:/(details|delete|items|assign|transition|media|audit|report|full-report|archive|cleanup|archive-status))?',p)
                if m:
                    cid,action=m[1],m[2];r=self.case(c,cid,u)
                    if not action and not mutation:return self.output(200,case_json(r))
                    if action=='archive-status' and not mutation:
                        row=c.execute('SELECT * FROM archives WHERE case_id=? ORDER BY created DESC LIMIT 1',(cid,)).fetchone()
                        return self.output(200,dict(row) if row else {})
                    if action=='full-report' and mutation:
                        if u['role'] not in ['cm','admin']:raise APIError(403,'仅CM或管理员可导出内部报告')
                        self.version(b,r)
                        if c.execute('SELECT 1 FROM archives WHERE case_id=? AND cleaned IS NOT NULL',(cid,)).fetchone():raise APIError(400,'照片已清理，请查看已保存报告')
                        d=case_json(r)
                        token=secrets.token_hex(16)
                        c.execute('INSERT INTO archives VALUES(?,?,?,?,?,NULL,NULL)',(token,cid,r['version'],'PDF-CONFIRM',time.time()))
                        audit(c,cid,u['id'],'打开全部问题报告','须人工确认PDF已保存');c.commit();d['archive_token']=token
                        return self.output(200,d)
                    if action=='archive' and mutation:
                        if u['role'] not in ['cm','admin'] or r['status']!='已完成':raise APIError(403,'仅CM或管理员可归档已完成案件')
                        self.version(b,r)
                        if c.execute('SELECT 1 FROM archives WHERE case_id=? AND cleaned IS NOT NULL',(cid,)).fetchone():raise APIError(400,'照片已清理，请使用此前保存的完整归档')
                        token=secrets.token_hex(16);buf=io.BytesIO();case=case_json(r)
                        events=[dict(x) for x in c.execute('SELECT a.*,u.name FROM audit a LEFT JOIN users u ON a.user_id=u.id WHERE case_id=? ORDER BY a.id',(cid,))]
                        media=c.execute('SELECT * FROM media WHERE case_id=?',(cid,)).fetchall()
                        photo_map={'/api/media/'+m['id']:'photos/'+m['id']+'.jpg' for m in media}
                        esc=html.escape
                        text='<!doctype html><meta charset="utf-8"><title>Internal full archive</title><style>body{font:15px system-ui;max-width:1100px;margin:30px auto}article{border-bottom:1px solid #ccc;padding:20px}img{max-width:240px;max-height:220px}p{white-space:pre-wrap}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}</style><h1>内部完整归档 · '+esc(case['address'])+'</h1><p>包含所有项目和内部信息，请勿作为租客报告发送。</p>'
                        for n,i in enumerate(case['items'],1):
                            text+='<article><h2>'+str(n)+'. '+esc(i['area']+' / '+i['item'])+'</h2>'
                            for k in ['kind','description','finding','junior','decision','cm','amount']:
                                text+='<p>'+esc(k)+': '+esc(str(i.get(k,'')))+'</p>'
                            text+='<div class="pair">'
                            for side in ['after','before']:
                                text+='<section><h3>'+side+'</h3>'
                                for url in i[side]:
                                    if url not in photo_map:raise APIError(400,'照片文件缺失，不能生成完整归档')
                                    text+='<a href="'+photo_map[url]+'"><img src="'+photo_map[url]+'"></a>'
                                text+='</section>'
                            text+='</div></article>'
                        text+='<h2>操作记录</h2>'+''.join('<p>'+esc(str(e['created'])+' '+str(e.get('name',''))+' '+e['event']+' '+e['detail'])+'</p>' for e in events)
                        with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
                            z.writestr('index.html',text)
                            z.writestr('case.json',json.dumps(case,ensure_ascii=False,indent=2))
                            z.writestr('audit.json',json.dumps(events,ensure_ascii=False,indent=2))
                            z.writestr('manifest.json',json.dumps({'case_id':cid,'version':r['version'],'created':time.time(),'photo_count':len(media),'archive_token':token},indent=2))
                            for m in media:z.writestr(photo_map['/api/media/'+m['id']],m['data'])
                        raw=buf.getvalue();digest=hashlib.sha256(raw).hexdigest()
                        c.execute('INSERT INTO archives VALUES(?,?,?,?,?,NULL,NULL)',(token,cid,r['version'],digest,time.time()))
                        audit(c,cid,u['id'],'生成内部完整归档',digest);c.commit()
                        return self.output(200,{'zip':base64.b64encode(raw).decode(),'token':token,'sha256':digest,'photos':len(media)})
                    if action=='cleanup' and mutation:
                        if u['role']!='admin':raise APIError(403,'仅管理员可清理照片')
                        self.version(b,r)
                        receipt=c.execute('SELECT * FROM archives WHERE token=? AND case_id=?',(b.get('token'),cid)).fetchone()
                        location=str(b.get('location','')).strip()
                        if r['status']!='已完成' or not receipt or receipt['version']!=r['version'] or receipt['cleaned'] is not None:raise APIError(400,'请为当前已完成版本重新导出归档')
                        if not location or b.get('confirmed') is not True or (not re.fullmatch('[a-f0-9]{64}',str(b.get('sha256',''))) if receipt['sha256']=='PDF-CONFIRM' else b.get('sha256')!=receipt['sha256']):raise APIError(400,'请确认归档文件已校验并填写保存位置')
                        items=json.loads(r['items'])
                        for i in items:
                            i['archived_photo_counts']={side:len(i[side]) for side in ['before','after']}
                            i['before']=[];i['after']=[]
                        count=c.execute('SELECT COUNT(*) FROM media WHERE case_id=?',(cid,)).fetchone()[0]
                        c.execute('DELETE FROM media WHERE case_id=?',(cid,))
                        self.bump(c,cid,items=json.dumps(items,ensure_ascii=False))
                        c.execute('UPDATE archives SET cleaned=?,location=? WHERE token=?',(time.time(),location,receipt['token']))
                        audit(c,cid,u['id'],'归档后清理照片',json.dumps({'photos':count,'location':location,'sha256':b.get('sha256')},ensure_ascii=False));c.commit()
                        reclaimed=True
                        try:c.execute('PRAGMA wal_checkpoint(TRUNCATE)');c.execute('VACUUM');c.execute('PRAGMA wal_checkpoint(TRUNCATE)')
                        except sqlite3.Error:reclaimed=False
                        return self.output(200,{'deleted_photos':count,'space_reclaimed':reclaimed})
                    if action=='audit' and not mutation:
                        return self.output(200,{'events':[dict(x) for x in c.execute('SELECT a.*,u.name FROM audit a LEFT JOIN users u ON a.user_id=u.id WHERE case_id=? ORDER BY a.id DESC LIMIT 200',(cid,))]})
                    if action=='report' and not mutation:
                        if u['role'] not in ['cm','admin']:raise APIError(403,'仅负责CM或管理员可导出报告')
                        d=case_json(r)
                        chosen=[i for i in d['items'] if i['decision']=='租客责任']
                        if not chosen:raise APIError(400,'没有已确认租客责任的项目可导出')
                        if any(not i['after'] or not i['cm'].strip() for i in chosen):raise APIError(400,'租客责任项目须补齐本次照片及CM对外说明后导出')
                        d['items'] = []
                        for item in chosen:
                            kind = item['kind'].strip()
                            if kind in ('清洁', '清洁问题'):
                                category = '清洁类'
                            elif kind in ('维修', '维修问题', '损坏', '损坏问题', '无法工作'):
                                category = '维修／损坏类'
                            else:
                                category = '其他类'
                            d['items'].append({
                                'report_category': category,
                                **{k: item[k] for k in ('area', 'item', 'cm', 'amount', 'after', 'before')},
                                'photo_pairs': item.get('photo_pairs', []),
                                **{key: item.get(key, '') for key in ('item_en', 'cm_en', 'area_en')},
                            })
                        return self.output(200,d)
                    if not mutation:raise APIError(404,'接口不存在')
                    self.version(b,r)
                    if action in ['details','delete','items','media','transition'] and c.execute('SELECT 1 FROM archives WHERE case_id=? AND cleaned IS NOT NULL',(cid,)).fetchone():raise APIError(400,'此案件已归档清理，保留文字记录供查阅，不可重新编辑；照片请查阅完整归档')
                    if action == 'details':
                        junior_editable = u['role'] == 'junior' and r['status'] in ('草稿', '退回补充')
                        if u['role'] == 'junior' and not junior_editable:
                            raise APIError(403, '案件已提交，请联系负责CM或管理员修改')
                        address = b.get('address')
                        if not isinstance(address, str) or not address.strip():
                            raise APIError(400, '请填写房源地址')
                        fields = {'address': address.strip()}
                        for key, label in [('current', '本次日期'), ('previous', '之前日期')]:
                            value = b.get(key)
                            if not isinstance(value, str):
                                raise APIError(400, f'{label}格式不正确')
                            if value:
                                try:
                                    if date.fromisoformat(value).isoformat() != value:
                                        raise ValueError
                                except ValueError:
                                    raise APIError(400, f'{label}格式不正确')
                            fields[key] = value
                        cm_id = b.get('cm_id', r['cm_id'])
                        if cm_id != r['cm_id']:
                            if u['role'] != 'admin' and not junior_editable:
                                raise APIError(403, '请联系管理员重新分配CM')
                            if not c.execute("SELECT 1 FROM users WHERE id=? AND role='cm' AND active=1", (cm_id,)).fetchone():
                                raise APIError(400, '请选择在职CM')
                            fields['cm_id'] = cm_id
                        self.bump(c, cid, **fields)
                        audit(c, cid, u['id'], '修改案件基本信息', json.dumps(
                            {key: {'原值': r[key], '新值': value} for key, value in fields.items() if r[key] != value},
                            ensure_ascii=False))
                    elif action == 'delete':
                        if u['role'] != 'admin' and not (u['role'] == 'junior' and r['status'] == '草稿'):
                            raise APIError(403, '仅管理员或负责该草稿的Junior CM可删除')
                        c.execute('INSERT INTO deleted_cases VALUES(?,?)', (cid, time.time()))
                        audit(c, cid, u['id'], '删除案件', r['address'])
                        c.commit()
                        return self.output(200, {'deleted': True})
                    elif action=='assign':
                        if u['role']!='admin':raise APIError(403,'仅管理员可调整分配')
                        self.assign_valid(c,b)
                        self.bump(c,cid,junior_id=b['junior_id'],cm_id=b['cm_id'])
                        audit(c,cid,u['id'],'调整负责人',json.dumps({'from':[r['junior_id'],r['cm_id']],'to':[b['junior_id'],b['cm_id']]}))
                    elif action=='items':
                        if r['status']=='已完成':raise APIError(400,'案件已完成，须由CM重新打开后编辑')
                        if u['role']=='junior' and r['status'] not in ['草稿','退回补充']:raise APIError(403,'案件已提交，等待CM审核或退回')
                        items=self.validate_items(c,cid,b.get('items'))
                        old={i['id']:i for i in json.loads(r['items'])}
                        if u['role']=='junior':
                            protected=['decision','cm','amount','cm_choice','cm_note','item_en','area_en','cm_en']
                            for i in items:
                                prev=old.get(i['id'],{})
                                if any(i.get(k,'')!=prev.get(k,'待审核' if k=='decision' else '') for k in protected):raise APIError(403,'Junior不可修改CM审核字段')
                            removed=set(old)-{i['id'] for i in items}
                            if any(old[i].get('decision')!='待审核' for i in removed):raise APIError(403,'已审核项目仅CM可删除')
                        self.bump(c,cid,items=json.dumps(items,ensure_ascii=False));audit(c,cid,u['id'],'保存项目',f'{len(items)}个项目')
                    elif action=='media':
                        if r['status']=='已完成' or u['role']=='junior' and r['status'] not in ['草稿','退回补充']:raise APIError(403,'当前状态不能添加照片')
                        try:raw=base64.b64decode(b.get('data',''),validate=True)
                        except (ValueError,TypeError):raise APIError(400,'照片编码无效')
                        if not raw.startswith(b'\xff\xd8\xff') or len(raw)>4*1024*1024:raise APIError(400,'仅接受4MB以内的JPEG照片')
                        mid=secrets.token_hex(16);c.execute('INSERT INTO media VALUES(?,?,?,?)',(mid,cid,raw,'image/jpeg'))
                        self.bump(c,cid);audit(c,cid,u['id'],'上传照片',mid);c.commit()
                        return self.output(201,{'url':'/api/media/'+mid,'version':r['version']+1})
                    elif action=='transition':
                        target=b.get('target');items=json.loads(r['items'])
                        if target=='待审核':
                            if u['role']!='junior':raise APIError(403,'仅负责Junior CM可提交CM审核')
                            if r['status'] not in ['草稿','退回补充']:raise APIError(400,'当前状态不能提交')
                            if not items or any(any(not i[k].strip() for k in ['area','item','kind','description','finding']) or not i['after'] for i in items):raise APIError(400,'每个项目须填写设施、问题说明及本次照片')
                        elif target in ['退回补充','已完成','草稿']:
                            if u['role'] not in ['cm','admin']:raise APIError(403,'仅负责CM可审核、退回或重新打开')
                            if target=='退回补充' and (r['status']!='待审核' or not str(b.get('note','')).strip()):raise APIError(400,'待审核案件退回时须填写原因')
                            if target=='已完成':
                                if r['status']!='待审核' or not items or any(i['decision']=='待审核' for i in items):raise APIError(400,'请逐项审核后完成案件')
                                for n,i in enumerate(items,1):
                                    if not i['cm'].strip():raise APIError(400,f'项目{n}（{i["area"]} / {i["item"]}）尚缺：CM对外说明')
                                    if i['decision']=='租客责任':
                                        missing=[]
                                        if not i['after']:missing.append('本次退租照片')
                                        if not i['cm'].strip():missing.append('CM对外说明')
                                        if missing:raise APIError(400,f'项目{n}（{i["area"]} / {i["item"]}）尚缺：'+ '、'.join(missing))
                            if target=='草稿':
                                if r['status']!='已完成':raise APIError(400,'仅已完成案件可重新打开')
                                target='待审核'
                        else:raise APIError(400,'状态无效')
                        self.bump(c,cid,status=target,return_note=str(b.get('note','')) if target=='退回补充' else '')
                        audit(c,cid,u['id'],'状态变更',r['status']+' → '+target+('：'+str(b.get('note','')) if target=='退回补充' else ''))
                    else:raise APIError(404,'接口不存在')
                    c.commit();return self.output(200,case_json(c.execute('SELECT * FROM cases WHERE id=?',(cid,)).fetchone()))
                raise APIError(404,'接口不存在')
        except APIError as e:self.output(e.code,{'error':e.message})
        except (ValueError,TypeError,KeyError,AttributeError):self.output(400,{'error':'输入格式不正确'})
        except Exception as e:
            print('Request failed:',type(e).__name__,flush=True)
            self.output(500,{'error':'服务器处理失败，请重试并联系管理员'})
    def assign_valid(self,c,b):
        for key,role in [('junior_id','junior'),('cm_id','cm')]:
            if not c.execute('SELECT 1 FROM users WHERE id=? AND role=? AND active=1',(b.get(key),role)).fetchone():raise APIError(400,'请选择有效的Junior与CM负责人')
    def validate_items(self,c,cid,items):
        if not isinstance(items,list) or len(items)>300:raise APIError(400,'项目列表无效或超过300项')
        ids=set()
        for i in items:
            if not isinstance(i,dict) or not isinstance(i.get('id'),str) or not re.fullmatch(r'[\w-]{1,80}',i['id']) or i['id'] in ids:raise APIError(400,'项目ID无效或重复')
            ids.add(i['id'])
            for k in ['area','item','kind','description','junior','finding','decision','cm','amount']:
                if not isinstance(i.get(k),str) or len(i[k])>10000:raise APIError(400,'项目字段格式不正确')
            if i['decision'] not in DECISIONS:raise APIError(400,'审核决定无效')
            if i['amount'] and (not re.fullmatch(r'\d+(?:\.\d{1,2})?',i['amount']) or float(i['amount'])>10000000):raise APIError(400,'金额须为有效非负金额，最多两位小数')
            for key in ('item_en', 'area_en', 'cm_en'):
                value = i.get(key, '')
                if not isinstance(value, str) or len(value) > 10000:
                    raise APIError(400, '定损报告英文内容格式不正确')
            for side in ['before','after']:
                if not isinstance(i.get(side),list) or len(i[side])>50:raise APIError(400,'每侧最多50张照片')
                for url in i[side]:
                    if not isinstance(url,str) or not re.fullmatch('/api/media/[a-f0-9]{32}',url) or not c.execute('SELECT 1 FROM media WHERE id=? AND case_id=?',(url.split('/')[-1],cid)).fetchone():raise APIError(400,'照片须属于当前案件')
        return items

if __name__=='__main__':
    init()
    host=os.environ.get('IRC_HOST','127.0.0.1');port=int(os.environ.get('IRC_PORT','8765'))
    print(f'Inspection Report Comparison: http://{host}:{port}',flush=True)
    if DEMO:print('演示模式，仅使用虚构资料。测试密码 Test-Only-2026!',flush=True)
    ThreadingHTTPServer((host,port),Handler).serve_forever()
