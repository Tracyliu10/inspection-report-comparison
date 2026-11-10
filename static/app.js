const app=document.getElementById('app');let user,csrf,users=[],cases=[],current,deletedItem;const areaOpen=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const englishInterface = new Map([
    ['Inspection Report Comparison · 协作工作台', 'Inspection Report Comparison · Workspace'],
    ['正在打开查房比对工作台…', 'Opening the inspection workspace…'],
    ['查房报告比对', 'Inspection Report Comparison'],
    ['协作工作台', 'Team Workspace'],
    ['房源分配 · 证据整理 · CM审核 · 租客报告', 'Property assignment · Evidence · CM review · Tenant reports'],
    ['登录工作台', 'Sign in to the workspace'], ['登录', 'Sign in'],
    ['邮箱', 'Email'], ['密码', 'Password'], ['退出登录', 'Sign out'],
    ['查房报告比对 · 多人协作版', 'Inspection Report Comparison · Team Workspace'],
    ['共享后台', 'Team workspace'], ['全部比对记录', 'All inspections'], ['房源工作台', 'My properties'],
    ['账号管理', 'Accounts'], ['管理员', 'Administrator'],
    ['仅显示您负责的案件；管理员可查看并分配全部房源。', 'You see cases assigned to you. Administrators can view and assign all properties.'],
    ['全部案件', 'All cases'], ['草稿', 'Draft'], ['待审核', 'Awaiting review'], ['退回补充', 'Return for updates'],
    ['已完成', 'Completed'], ['全部状态', 'All statuses'], ['全部 CM', 'All CMs'],
    ['搜索房源', 'Search properties'], ['房源', 'Property'], ['状态', 'Status'], ['打开案件', 'Open case'],
    ['＋ 新增房源并开始比对', '+ New property inspection'], ['新增房源并开始比对', 'New property inspection'],
    ['例如：310华一。选择对应CM后即可添加比对项目。', 'Select the assigned CM to start adding comparison items.'],
    ['物业地址', 'Property address'], ['房源地址', 'Property address'],
    ['本次日期', 'Current inspection date'], ['之前日期', 'Previous inspection date'], ['之前报告日期', 'Previous inspection date'],
    ['负责Junior', 'Assigned Junior CM'], ['负责CM', 'Assigned CM'], ['创建案件', 'Create case'],
    ['编辑案件信息', 'Edit case details'], ['删除案件', 'Delete case'], ['保存案件信息', 'Save case details'],
    ['如需更换负责CM，请联系管理员。', 'Contact an administrator to change the assigned CM.'],
    ['保存后再提交。照片会压缩后共享保存；原始证据请另存。未记录问题不自动代表入住时完好。', 'Save before submitting. Photos are compressed for sharing. Keep original evidence separately. An unrecorded issue does not establish the condition at move-in.'],
    ['＋ 添加比对项目', '+ Add comparison item'],
    ['* 为当前步骤必填项；之前同位置照片与金额选填。CM审核字段由CM填写。', '* Required for the current step. Previous photos and amounts are optional. The CM completes the review fields.'],
    ['区域问题清单', 'Issues by area'], ['点击区域展开或收起，按区域逐项审核。', 'Expand an area to review its items one by one.'],
    ['尚无问题项目。', 'No issues added yet.'], ['未指定区域', 'Unspecified area'],
    ['已逐项审核', 'All items reviewed'], ['未填写设施', 'Item not specified'], ['未填写', 'Not provided'],
    ['删除误加项目', 'Remove item'], ['区域', 'Area'], ['设施', 'Item / fixture'],
    ['例如：墙面、抽油烟机', 'e.g. wall or rangehood'],
    ['问题类型', 'Issue type'], ['问题说明', 'Issue description'], ['比对结论', 'Comparison finding'],
    ['简要描述问题，特殊情况可在这里补充', 'Briefly describe the issue and any relevant circumstances'],
    ['清洁', 'Cleaning'], ['清洁问题', 'Cleaning'], ['维修', 'Repair'], ['维修问题', 'Repair'],
    ['损坏', 'Damage'], ['损坏问题', 'Damage'], ['无法工作', 'Not working'], ['其他', 'Other'], ['其他问题', 'Other'], ['其它', 'Other'],
    ['待核实', 'To be verified'], ['之前已有', 'Previously present'], ['之前未见', 'Not seen previously'],
    ['缺少同位置照片', 'No matching previous photo'], ['疑似加重', 'May have worsened'],
    ['本次退租照片', 'Current move-out photos'], ['之前同位置照片（选填）', 'Previous photos of the same location (optional)'],
    ['＋ 拖入照片，或点击选择', '+ Drop photos here or click to select'], ['删除', 'Delete'],
    ['CM 审核', 'CM review'], ['审核决定', 'Review decision'], ['CM对外说明', 'CM note for tenant'],
    ['请选择', 'Select an option'], ['租客责任', 'Tenant responsibility'], ['原有问题', 'Pre-existing issue'],
    ['合理损耗', 'Fair wear and tear'], ['证据不足', 'Insufficient evidence'], ['维修跟进', 'Maintenance follow-up'],
    ['无须定损', 'No charge required'], ['需向租客核实', 'To be confirmed with the tenant'], ['自然磨损', 'Fair wear and tear'],
    ['请填写其它说明', 'Enter the explanation'], ['其它说明', 'Other explanation'], ['金额 AUD（选填）', 'Amount AUD (optional)'],
    ['英文定损报告内容（按需填写）', 'English damage report content (as needed)'], ['英文区域', 'Area in English'],
    ['原区域已是英文可留空', 'Leave blank if the area is already in English'], ['英文设施名称', 'Item name in English'],
    ['原设施名已是英文可留空', 'Leave blank if the item name is already in English'], ['英文 CM 对外说明', 'CM note for tenant in English'],
    ['固定选项会翻译；自定义中文说明请填写英文版', 'Preset notes are translated automatically. Enter English for custom Chinese notes.'],
    ['＋ 项目', '+ Add item'], ['保存修改', 'Save changes'], ['提交CM审核', 'Submit for CM review'], ['完成审核', 'Complete review'],
    ['重新打开', 'Reopen'], ['撤销上次删除', 'Undo last deletion'], ['自动填充英文', 'Auto-fill English'],
    ['导出定损报告（PDF）', 'Export damage report (PDF)'],
    ['导出全部问题报告（PDF）', 'Export full inspection report (PDF)'], ['归档后清理照片', 'Remove photos after archiving'],
    ['操作记录', 'Activity log'], ['前后照片对照', 'Compare current and previous photos'],
    ['可分别选择照片，使用滑杆放大查看细节。', 'Select each photo separately and use the slider to zoom in.'],
    ['关闭', 'Close'], ['关闭 ×', 'Close ×'], ['本次退租', 'Current move-out'], ['之前同位置', 'Previous · same location'],
    ['上一张', 'Previous'], ['下一张', 'Next'], ['选择照片', 'Select photo'], ['放大照片', 'Zoom in'], ['缩小照片', 'Zoom out'],
    ['照片缩放比例', 'Photo zoom'], ['适应窗口', 'Fit to window'], ['尚无照片', 'No photos'],
    ['最高放大5倍；放大后可拖动图片或滚动查看细节。双击图片切换放大。', 'Zoom up to 5×. Drag or scroll to inspect details. Double-click to toggle zoom.'],
    ['对照证据', 'Comparison evidence'], ['选择已保存的配对角度', 'Select saved photo pair'], ['已保存角度配对', 'Saved photo pairs'],
    ['分别选择同角度、同位置的照片，再保存配对。可保留多组不同角度。', 'Select photos of the same location and angle, then save them as a pair. Multiple pairs can be saved.'],
    ['保存当前两张为一组对照', 'Save selected pair'],
    ['仅管理员可创建、编辑及启停账号。停用后立即禁止登录，历史比对记录继续保留。', 'Administrators manage accounts. Deactivation blocks sign-in and preserves case history.'],
    ['创建团队账号', 'Create team account'], ['姓名', 'Name'], ['登录邮箱', 'Sign-in email'], ['账号角色', 'Account role'],
    ['初始密码（至少8位）', 'Initial password (at least 8 characters)'], ['操作', 'Actions'], ['创建账号', 'Create account'],
    ['角色', 'Role'], ['启用', 'Active'], ['已停用', 'Inactive'], ['编辑账号', 'Edit account'],
    ['停用账号', 'Deactivate account'], ['启用账号', 'Activate account'], ['当前账号', 'Current account'],
    ['新密码（至少8位；留空保留原密码）', 'New password (at least 8 characters, optional)'], ['保存账号', 'Save account'],
    ['修改邮箱或密码后，该账号在其他设备的登录会失效；历史案件归属保持不变。', 'Changing the email or password signs the user out on other devices. Case assignments are preserved.'],
    ['账号已创建，可使用设置的邮箱和初始密码登录。', 'Account created. The user can sign in with the email and initial password.'],
    ['账号修改已保存。', 'Account changes saved.'],
    ['确认PDF归档并清理照片', 'Confirm PDF archive and remove photos'],
    ['不可撤销。仅清理此案件在系统中的全部照片，保留文字及审核记录。清理后案件只读，不能重新生成带照片的报告。现有服务器备份不受影响。', 'This permanently removes this case’s photos from the workspace. Written findings and review history are retained. The case becomes read-only, and reports with photos cannot be regenerated.'],
    ['选择刚保存的全部问题报告 PDF（确认已保存）', 'Select the full inspection report PDF you saved'],
    ['公司归档位置（文件夹路径或内部链接）', 'Company archive location (folder path or internal link)'],
    ['我已打开PDF检查全部项目、照片和审核结果，并保存到公司归档位置', 'I checked all items, photos and review findings in the PDF and saved it to the company archive.'],
    ['确认永久清理本案件照片', 'Permanently remove this case’s photos'],
    ['完整照片请查看已保存归档。', 'See the saved archive for the full photos.'],
    ['已共享保存', 'Changes saved'], ['请填写退回原因', 'Enter the reason for returning this case'],
    ['请拖入图片文件', 'Drop an image file'], ['单张照片不得超过30MB', 'Each photo must be 30 MB or smaller'],
    ['请先添加问题项目', 'Add at least one issue first'], ['请确认已保存修改', 'Make sure your changes are saved'],
    ['请允许弹出报告窗口后重试', 'Allow the report pop-up and try again'],
    ['照片加载失败，不能生成完整报告', 'A photo could not be loaded. The complete report could not be generated.'],
    ['请先导出当前版本的全部问题报告（PDF）', 'Export the full inspection report PDF for the current version first'],
    ['请选择全部问题PDF、填写保存位置并确认已检查', 'Select the full report PDF, enter its archive location and confirm that you checked it'],
    ['请选择有效PDF文件', 'Select a valid PDF file'], ['请重新导出全部问题报告PDF', 'Export the full inspection report PDF again'],
    ['正在准备翻译…', 'Preparing translation…'], ['正在翻译…', 'Translating…'],
    ['当前定损项目没有需要自动填充的英文内容。', 'No English translations are missing for the current damage report.'],
    ['此浏览器不支持自动翻译。请使用支持内置翻译的桌面版 Chrome，或手动填写英文。', 'Automatic translation is unavailable in this browser. Use desktop Chrome with built-in translation or enter the English text manually.'],
    ['自动翻译暂不可用。请稍后重试或手动填写英文。', 'Automatic translation is temporarily unavailable. Try again or enter the English text manually.'],
    ['没有可填充的译文。请检查项目或手动填写英文。', 'No translations were filled in. Check the items or enter English manually.'],
    ['邮箱或密码错误', 'Incorrect email or password'], ['请先登录', 'Sign in to continue'],
    ['账号已停用，请联系管理员', 'This account is inactive. Contact your administrator.'],
    ['安全校验失败，请刷新后重试', 'Security check failed. Refresh and try again.'],
    ['案件不存在或无权访问', 'Case not found or access denied'],
    ['案件已被其他人更新，请刷新案件后重新编辑；当前输入仍保留在页面中', 'Someone else updated this case. Refresh before editing again. Your current entries are still on screen.'],
    ['请填写房源地址', 'Enter the property address'], ['请填写物业地址', 'Enter the property address'],
    ['请选择在职CM', 'Select an active CM'], ['本次日期格式不正确', 'Invalid current inspection date'], ['之前日期格式不正确', 'Invalid previous inspection date'],
    ['请输入姓名及有效邮箱', 'Enter a name and valid email address'], ['请输入姓名、有效邮箱、角色及至少8位初始密码', 'Enter a name, valid email, role and a password of at least 8 characters'],
    ['该邮箱已存在', 'This email is already in use'], ['该邮箱已被其他账号使用', 'This email is already in use'],
    ['新密码至少8位；留空保留原密码', 'Enter at least 8 characters or leave the password blank'],
    ['没有已确认租客责任的项目可导出', 'There are no items confirmed as tenant responsibility to export'],
    ['租客责任项目须补齐本次照片及CM对外说明后导出', 'Add current photos and a tenant-facing CM note to each tenant responsibility item before exporting'],
    ['请逐项审核后完成案件', 'Review each item before completing the case'],
    ['金额须为有效非负金额，最多两位小数', 'Enter a non-negative amount with up to two decimal places'],
    ['服务器处理失败，请重试并联系管理员', 'The request failed. Try again or contact your administrator.'],
    ['请选择有效的Junior与CM负责人', 'Select valid Junior CM and CM assignees'],
    ['案件已提交，请联系负责CM或管理员修改', 'This case was submitted. Contact the assigned CM or an administrator to edit it.'],
    ['请联系管理员重新分配CM', 'Contact an administrator to reassign the CM'],
    ['仅管理员或负责该草稿的Junior CM可删除', 'Only an administrator or the Junior CM assigned to the draft can delete it'],
    ['登录尝试过多，请15分钟后重试', 'Too many sign-in attempts. Try again in 15 minutes.'],
    ['当前状态不能提交', 'This case cannot be submitted in its current status'],
    ['每个项目须填写设施、问题说明及本次照片', 'Enter the item, description and current photos for every issue'],
    ['待审核案件退回时须填写原因', 'Enter a reason for returning this case'],
    ['案件已完成，须由CM重新打开后编辑', 'The case is completed. The CM must reopen it before editing.'],
    ['当前状态不能添加照片', 'Photos cannot be added in the current case status'],
    ['仅接受4MB以内的JPEG照片', 'Upload a JPEG photo under 4 MB'],
    ['请求过大，请压缩图片后重试', 'The request is too large. Compress the image and try again.'],
    ['照片已清理，请查看已保存报告', 'Photos have been removed. See the saved report.'],
    ['请确认归档文件已校验并填写保存位置', 'Verify the archived file and enter its storage location'],
    ['请为当前已完成版本重新导出归档', 'Export an archive for the current completed version'],
    ['此案件已归档清理，保留文字记录供查阅，不可重新编辑；照片请查阅完整归档', 'This archived case is read-only. Refer to the full archive for its photos.'],

]);

const uiPatterns = [
    [/^本次日期：(.+) · 之前日期：(.+)$/, (_, current, previous) => 'Current inspection: '+translateInterface(current)+' · Previous inspection: '+translateInterface(previous)],
    [/^(Junior：.*? · CM：.*?) · (草稿|待审核|退回补充|已完成) · 版本 (\d+)$/, (_, people, status, version) => people.replaceAll('：', ': ')+' · '+translateInterface(status)+' · Version '+version],
    [/^负责Junior：(.+)$/, (_, name) => 'Assigned Junior CM: '+name],
    [/^退回原因：(.*)$/s, (_, note) => 'Return reason: '+note],
    [/^照片已归档清理 · (.+)$/, (_, timestamp) => 'Photos archived and removed · '+timestamp],
    [/^归档位置：(.*?)。完整照片请查看已保存归档。$/s, (_, location) => 'Archive location: '+location+'. See the saved archive for photos.'],
    [/^项目 (\d+)( · .*)$/s, (_, count, rest) => 'Item '+count+rest.replace(/未填写设施$/, 'Item not specified')],
    [/^(.*?) · 问题 (\d+ \/ \d+) · (.*)$/s, (_, area, number, item) => area+' · Issue '+number+' · '+translateInterface(item)],
    [/^(\d+) 项问题$/, (_, count) => count+' issue'+(count==='1'?'':'s')],
    [/^待审核 (\d+) 项$/, (_, count) => count+' awaiting review'],
    [/^(证据照片|照片) (.+)$/, (_, label, count) => (label==='照片'?'Photo ':'Evidence photo ')+count],
    [/^配对 (\d+)：本次照片 (\d+) ↔ 之前照片 (\d+)$/, (_, n, after, before) => 'Pair '+n+': current '+after+' ↔ previous '+before],
    [/^已保存 (\d+) 组配对；重新打开可选择$/, (_, count) => count+' photo pairs saved. Reopen to select.'],
    [/^团队账号 · (\d+) 人$/, (_, count) => 'Team accounts · '+count],
    [/^编辑账号 · (.+)$/, (_, name) => 'Edit account · '+name],
    [/^下载翻译模型 (.+)$/, (_, progress) => 'Downloading translation model '+progress],
    [/^已填充 (\d+) 处英文。.*$/s, (_, count) => 'Filled '+count+' English fields. Check them before saving or exporting.'],
    [/^确认删除案件「(.+?)」？删除后案件将从工作台移除。$/s, (_, address) => 'Delete case “'+address+'” and remove it from the workspace?'],
    [/^删除「(.+?)」的(本次|之前)照片 (\d+)？仅移除此照片。$/s, (_, item, side, count) => 'Remove '+(side==='本次'?'current':'previous')+' photo '+count+' from “'+item+'”?'],
    [/^确认删除【项目 (\d+)】\n区域：(.*?)\n设施：(.*?)\n说明：(.*?)\n仅删除以上项目，照片引用和备注一起移除。$/s, (_, n, area, item, note) => 'Delete item '+n+'?\nArea: '+area+'\nItem: '+translateInterface(item)+'\nDescription: '+translateInterface(note)],
    [/^(停用|启用)账号：(.+?)？历史案件不会删除。$/s, (_, action, account) => (action==='停用'?'Deactivate ':'Activate ')+account+'? Case history is retained.'],
    [/^请补充以下必填项：\n(.*)$/s, (_, details) => 'Complete these required fields:\n'+details.split('\n').map(translateInterface).join('\n')],
    [/^项目(\d+)（(.*?)）尚缺：(.+)$/, (_, number, item, fields) => 'Item '+number+' ('+item+'): missing '+fields.split('、').map(translateInterface).join(', ')],
    [/^项目 (\d+)（(.*?)）：(.+)$/, (_, number, item, label) => 'Item '+number+' ('+item+'): '+translateInterface(label)],
    [/^请在以下项目的「英文定损报告内容」中补充翻译：\n(.*)$/s, (_, details) => 'Add translations under “English damage report content” for:\n'+details.replaceAll('英文 CM 对外说明','CM note in English').replaceAll('英文设施名称','item name in English').replaceAll('英文区域','area in English')],
    [/^确定永久清理「(.+?)」全部服务器照片？$/s, (_, address) => 'Permanently remove all stored photos for “'+address+'”?'],
    [/^此案件照片已清理。归档位置：(.*)$/s, (_, location) => 'Case photos were removed. Archive location: '+location],
    [/^已清理 (\d+) 张照片。(.+)$/, (_, count, result) => 'Removed '+count+' photos. '+(result==='数据库空间已回收。'?'Database space was reclaimed.':'Database space can be reclaimed during maintenance.')],
];

let interfaceLanguage = 'zh';
try { if (localStorage.getItem('inspection-interface-language') === 'en') interfaceLanguage = 'en'; } catch {}
const interfaceSource = new WeakMap();
const interfaceAttributes = new WeakMap();

function translateInterface(text) {
    if (interfaceLanguage !== 'en') return text;
    if (englishInterface.has(text)) return englishInterface.get(text);
    for (const [pattern, replacement] of uiPatterns) {
        if (pattern.test(text)) return text.replace(pattern, replacement);
    }
    return text;
}

function localizeInterface() {
    document.documentElement.lang = interfaceLanguage === 'en' ? 'en' : 'zh-CN';
    document.title = translateInterface('Inspection Report Comparison · 协作工作台');
    for (const root of [app, document.getElementById('photoDialog'), document.getElementById('formDialog')]) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const parent = node.parentElement;
            if (!parent || parent.closest('textarea, [data-user-text]')) continue;
            const previous = interfaceSource.get(node);
            const source = previous?.rendered === node.data ? previous.source : node.data;
            const trimmed = source.trim();
            if (!trimmed) continue;
            const rendered = source.replace(trimmed, () => translateInterface(trimmed));
            if (rendered !== node.data && parent.tagName === 'OPTION' && !parent.hasAttribute('value')) {
                parent.value = parent.textContent.trim();
            }
            interfaceSource.set(node, {source, rendered});
            if (rendered !== node.data) node.data = rendered;
        }
        for (const element of root.querySelectorAll('[placeholder], [aria-label], img[alt]')) {
            const originals = interfaceAttributes.get(element) || {};
            for (const key of ['placeholder','aria-label','alt']) {
                const value = element.getAttribute(key);
                if (value === null) continue;
                const previous = originals[key];
                const source = previous?.rendered === value ? previous.source : value;
                const rendered = translateInterface(source);
                originals[key] = {source, rendered};
                if (rendered !== value) element.setAttribute(key, rendered);
            }
            interfaceAttributes.set(element, originals);
        }
        root.querySelectorAll('[data-interface-language]').forEach(select => {select.value=interfaceLanguage});
    }
}

function languagePicker() {
    return '<select class="interface-language" data-interface-language aria-label="Language / 语言"><option value="zh">中文</option><option value="en">English</option></select>';
}

function setInterfaceLanguage(value) {
    interfaceLanguage = value === 'en' ? 'en' : 'zh';
    try { localStorage.setItem('inspection-interface-language', interfaceLanguage); } catch {}
    localizeInterface();
}

function uiAlert(message) { window.alert(translateInterface(String(message))); }
function uiConfirm(message) { return window.confirm(translateInterface(String(message))); }
function uiPrompt(message) { return window.prompt(translateInterface(String(message))); }

async function api(path,data){let r=await fetch('/api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf||''},body:data?JSON.stringify(data):undefined});let v=await r.json();if(!r.ok)throw Error(v.error);return v}
function error(e){uiAlert(e.message)}
function field(k,label,value='',type='text'){return `<div class="field"><label>${label}</label><input id="${k}" type="${type}" value="${esc(value)}"></div>`}
function login(){app.innerHTML=`<div class="login-page"><div class="login-art"><h1>查房报告比对<br>协作工作台</h1><p>房源分配 · 证据整理 · CM审核 · 租客报告</p></div><div class="login-box"><div><div class="login-language">${languagePicker()}</div><h2>登录工作台</h2>${field('email','邮箱','','email')}${field('password','密码','','password')}<button id="login" class="primary">登录</button></div></div></div>`;document.getElementById('login').onclick=async()=>{try{let v=await api('login',{email:document.getElementById('email').value,password:document.getElementById('password').value});user=v.user;csrf=v.csrf;await home()}catch(e){error(e)}}}
function shell(content){app.innerHTML=`<div class="layout"><aside class="sidebar"><div class="brand">Inspection<br>Comparison</div><div class="nav"><button id="home">${user.role==='admin'?'全部比对记录':'房源工作台'}</button>${user.role==='admin'?'<button id="accounts">账号管理</button>':''}</div><div class="identity"><strong data-user-text>${esc(user.name)}</strong><small>${esc(user.role)}</small><button id="logout">退出登录</button></div></aside><main class="workspace"><header class="topbar"><h1>查房报告比对 · 多人协作版</h1><div class="header-tools"><span class="tag">共享后台</span>${languagePicker()}</div></header><div class="content">${content}</div></main></div>`;if(document.getElementById('accounts'))document.getElementById('accounts').onclick=()=>accountPage().catch(error);document.getElementById('home').onclick=()=>home().catch(error);document.getElementById('logout').onclick=async()=>{await api('logout',{});login()}}
async function home(){users=(await api('users')).users;cases=(await api('cases')).cases;current=null;shell(`<div class="banner">仅显示您负责的案件；管理员可查看并分配全部房源。</div><div class="metrics">${['全部案件','草稿','待审核','退回补充'].map((s,n)=>`<div class="metric">${s}<strong>${n?cases.filter(c=>c.status===s).length:cases.length}</strong></div>`).join('')}</div>${['admin','junior'].includes(user.role)?'<button id="new" class="primary">＋ 新增房源并开始比对</button>':''}<div class="toolbar"><input id="caseSearch" placeholder="搜索房源"><select id="caseCM"><option value="">全部 CM</option>${users.filter(u=>u.role==='cm').map(u=>`<option data-user-text value="${u.id}">${esc(u.name)}</option>`).join('')}</select><select id="caseStatus"><option value="">全部状态</option>${['草稿','待审核','退回补充','已完成'].map(v=>`<option>${v}</option>`).join('')}</select></div><div class="panel"><table class="case-table"><thead><tr><th>房源</th><th>Junior</th><th>CM</th><th>状态</th><th></th></tr></thead><tbody>${cases.map(c=>`<tr data-case="${c.id}"><td data-user-text>${esc(c.address)}</td><td>${name(c.junior_id)}</td><td>${name(c.cm_id)}</td><td>${esc(c.status)}</td><td><button data-open="${c.id}">打开案件</button></td></tr>`).join('')}</tbody></table></div>`);for(let id of ['caseSearch','caseCM','caseStatus'])document.getElementById(id).oninput=()=>{app.querySelectorAll('[data-case]').forEach(row=>{let c=cases.find(v=>v.id===row.dataset.case);row.hidden=!(c.address.toLowerCase().includes(val('caseSearch').toLowerCase())&&(!val('caseCM')||c.cm_id===val('caseCM'))&&(!val('caseStatus')||c.status===val('caseStatus')))})};app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCase(b.dataset.open).catch(error));if(document.getElementById('new'))document.getElementById('new').onclick=newCase}
function name(id){return esc(users.find(u=>u.id===id)?.name||id)}
function choices(role,id){return `<select id="${id}">${users.filter(u=>u.role===role&&u.active).map(u=>`<option data-user-text value="${u.id}">${esc(u.name)}</option>`).join('')}</select>`}
function newCase(){shell(`<div class="panel"><h2>新增房源并开始比对</h2><p class="help">例如：310华一。选择对应CM后即可添加比对项目。</p>${field('address','物业地址')}${field('date','本次日期','','date')}${field('previous','之前报告日期','','date')}${user.role==='admin'?'<label>负责Junior</label>'+choices('junior','junior'):'<p>负责Junior：'+esc(user.name)+'</p>'}<label>负责CM</label>${choices('cm','cm')}<button id="create" class="primary">创建案件</button></div>`);document.getElementById('create').onclick=async()=>{try{let v=await api('cases',{address:val('address'),current:val('date'),previous:val('previous'),junior_id:user.role==='junior'?user.id:val('junior'),cm_id:val('cm')});await openCase(v.id)}catch(e){error(e)}}}
const val=id=>document.getElementById(id).value;
async function openCase(id){current=await api('cases/'+id);current.archive=await api('cases/'+id+'/archive-status');for(let i of current.items){if(i.decision==='维修跟进')i.decision='待审核';if(i.junior&&i.junior.trim()&&!i.description.includes(i.junior.trim()))i.description+=(i.description?'\n':'')+i.junior.trim();i.junior=''}renderCase()}
function issueSelect(key,options,i,editable){let value=i[key]||options[0];if(key==='kind')value=({'清洁':'清洁问题','维修':'维修问题','损坏':'损坏问题','其他':'其他问题'})[value]||value;let all=options.includes(value)?options:[value,...options];return `<select data-key="${key}" ${editable?'':'disabled'}>${all.map(v=>`<option ${v===value?'selected':''}>${esc(v)}</option>`).join('')}</select>`}
function renderCase(){let c=current,canEditDetails=!c.archive?.cleaned&&(user.role!=='junior'||['草稿','退回补充'].includes(c.status)),canDelete=!c.archive?.cleaned&&(user.role==='admin'||user.role==='junior'&&c.status==='草稿'),editable=c.status!=='已完成'&&(user.role!=='junior'||['草稿','退回补充'].includes(c.status));shell(`<div class="case-head"><div><h2 data-user-text>${esc(c.address)}</h2><p>Junior：${name(c.junior_id)} · CM：${name(c.cm_id)} · ${esc(c.status)} · 版本 ${c.version}</p><p class="help">本次日期：${esc(c.current||'未填写')} · 之前日期：${esc(c.previous||'未填写')}</p></div><div class="toolbar">${canEditDetails?'<button id="editCaseDetails">编辑案件信息</button>':''}${canDelete?'<button id="deleteCase" class="danger">删除案件</button>':''}</div></div>${c.archive?.cleaned?`<div class="banner">照片已归档清理 · ${esc(new Date(c.archive.cleaned*1000).toLocaleString())}<br>归档位置：${esc(c.archive.location)}。完整照片请查看已保存归档。</div>`:''}${c.return_note?`<div class="banner warn">退回原因：${esc(c.return_note)}</div>`:''}<div class="notice">保存后再提交。照片会压缩后共享保存；原始证据请另存。未记录问题不自动代表入住时完好。</div><div class="toolbar">${editable?'<button id="addTop" class="primary">＋ 添加比对项目</button>':''}<span class="help">* 为当前步骤必填项；之前同位置照片与金额选填。CM审核字段由CM填写。</span></div>${user.role!=='junior'?'<div class="area-overview"><strong>区域问题清单</strong><p class="help">点击区域展开或收起，按区域逐项审核。</p><div id="areaSummary"></div></div>':''}<div id="issues">${c.items.map((i,n)=>`<article class="issue" data-index="${n}"><div class="issue-head"><h3>项目 ${n+1} · ${esc(i.area)} / ${esc(i.item||'未填写设施')}</h3>${editable?`<button data-delete="${n}" class="right danger">删除误加项目</button>`:''}</div><div class="issue-meta"><div class="field"><label>区域 <span class="required">*</span></label>${issueSelect('area',['General','Entry','Lounge','Dining room','Kitchen','Bedroom 1','Bedroom 2','Bedroom 3','Bedroom 4','Bathroom 1','Bathroom 2','Bathroom 3','Laundry','Balcony','Furniture','Study room','Store room','Hallway','Garage / Car space','Storage cage','Courtyard / Terrace','Other'],i,editable)}</div><div class="field"><label>设施 <span class="required">*</span></label><input data-key="item" value="${esc(i.item)}" placeholder="例如：墙面、抽油烟机" ${editable?'':'disabled'}></div><div class="field"><label>问题类型 <span class="required">*</span></label>${issueSelect('kind',['清洁问题','维修问题','损坏问题','无法工作','其他问题'],i,editable)}</div></div><div class="issue-details"><div class="field"><label>问题说明 <span class="required">*</span></label><textarea rows="2" data-key="description" placeholder="简要描述问题，特殊情况可在这里补充" ${editable?'':'disabled'}>${esc(i.description)}</textarea></div><div class="field"><label>比对结论 <span class="required">*</span></label>${issueSelect('finding',['待核实','之前已有','之前未见','缺少同位置照片','疑似加重'],i,editable)}</div></div><div class="compare">${['after','before'].map(k=>`<div class="photo-side"><h4>${k==='after'?'本次退租照片 <span class="required">*</span>':'之前同位置照片（选填）'}</h4><div class="thumbs">${i[k].map((p,photoIndex)=>`<div class="photo-tile"><button type="button" class="photo-button" data-photo="${n}" data-side="${k}" data-photo-index="${photoIndex}"><img loading="lazy" src="${p}" alt="证据照片 ${photoIndex+1}"></button><span class="photo-label">照片 ${photoIndex+1}</span>${editable?`<button class="delete-photo" type="button" data-delete-photo="${n}" data-side="${k}" data-photo-index="${photoIndex}">删除</button>`:''}</div>`).join('')}</div>${editable?`<label class="drop" data-drop="${k}" data-index="${n}"><span>＋ 拖入照片，或点击选择</span><input type="file" accept="image/*" multiple data-upload="${k}" data-index="${n}"></label>`:''}</div>`).join('')}</div><div class="review"><h4>CM 审核</h4><div class="review-fields"><div class="field review-decision"><label>审核决定 <span class="required">*</span></label><select data-key="decision" ${editable&&user.role!=='junior'?'':'disabled'}>${['待审核','租客责任','原有问题','合理损耗','证据不足'].map(d=>`<option ${d===i.decision?'selected':''}>${d}</option>`).join('')}</select></div><div class="field"><label>CM对外说明 <span class="required">*</span></label><select data-cm-choice ${editable&&user.role!=='junior'?'':'disabled'}><option value="">请选择</option>${['无须定损','需向租客核实','自然磨损','其它'].map(v=>`<option ${cmChoice(i)===v?'selected':''}>${v}</option>`).join('')}</select><textarea data-cm-note rows="2" placeholder="请填写其它说明" style="display:${cmChoice(i)==='其它'?'block':'none'}" ${editable&&user.role!=='junior'?'':'disabled'}>${esc(i.cm_note??(cmChoice(i)==='其它'?i.cm:''))}</textarea></div><div class="field"><label>金额 AUD（选填）</label><input data-key="amount" value="${esc(i.amount)}" ${editable&&user.role!=='junior'?'':'disabled'}></div></div>${user.role!=='junior'?`<details class="report-english"><summary>英文定损报告内容（按需填写）</summary>
<div class="grid2"><div class="field"><label>英文区域</label><input data-key="area_en" placeholder="原区域已是英文可留空" value="${esc(i.area_en)}" ${editable?'':'disabled'}></div>
<div class="field"><label>英文设施名称</label><input data-key="item_en" placeholder="原设施名已是英文可留空" value="${esc(i.item_en)}" ${editable?'':'disabled'}></div></div>
<div class="field"><label>英文 CM 对外说明</label><textarea rows="2" data-key="cm_en" placeholder="固定选项会翻译；自定义中文说明请填写英文版" ${editable?'':'disabled'}>${esc(i.cm_en)}</textarea></div>
</details>`:''}</div></article>`).join('')}</div><div class="sticky-actions">${editable?'<button id="add">＋ 项目</button><button id="save" class="primary">保存修改</button>':''}${user.role==='junior'&&['草稿','退回补充'].includes(c.status)?'<button data-state="待审核">提交CM审核</button>':''}${user.role!=='junior'&&c.status==='待审核'?'<button data-state="退回补充">退回补充</button><button data-state="已完成" class="primary">完成审核</button>':''}${user.role!=='junior'&&c.status==='已完成'?'<button data-state="草稿">重新打开</button>':''}${deletedItem&&deletedItem.caseId===c.id&&editable?'<button id="undo">撤销上次删除</button>':''}${editable&&user.role!=='junior'?'<button id="translateReportEn">自动填充英文</button>':''}${user.role!=='junior'?'<button id="report" class="primary">导出定损报告（PDF）</button>':''}${user.role!=='junior'?'<button id="fullArchive">导出全部问题报告（PDF）</button>':''}${user.role==='admin'&&c.status==='已完成'?'<button id="cleanup" class="danger">归档后清理照片</button>':''}<button id="audit">操作记录</button></div>`);
if (canEditDetails) document.getElementById('editCaseDetails').onclick = () => editCaseDetails(c);
if (canDelete) document.getElementById('deleteCase').onclick = () => deleteCase(c);
if(user.role!=='junior')groupIssues(c);
app.querySelectorAll('[data-cm-choice]').forEach(el=>{let article=el.closest('.issue'),n=+article.dataset.index,note=article.querySelector('[data-cm-note]');function update(){let i=current.items[n];i.cm_choice=el.value;i.cm_note=note.value;i.cm=el.value==='其它'?note.value:el.value;note.style.display=el.value==='其它'?'block':'none';el.classList.remove('invalid');note.classList.remove('invalid')}el.onchange=update;note.oninput=update});
app.querySelectorAll('[data-key]').forEach(el=>el.oninput=()=>{let n=el.closest('[data-index]').dataset.index;c.items[n][el.dataset.key]=el.value;el.classList.remove('invalid')});
if(editable){document.getElementById('add').onclick=()=>{c.items.push({id:crypto.randomUUID(),area:'Entry',item:'',kind:'清洁问题',description:'',finding:'待核实',junior:'',before:[],after:[],decision:'待审核',cm:'',amount:''});renderCase()};if(document.getElementById('addTop'))document.getElementById('addTop').onclick=()=>document.getElementById('add').click();document.getElementById('save').onclick=()=>save().then(()=>uiAlert('已共享保存')).catch(error)}
app.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{let n=+b.dataset.delete,i=c.items[n];if(uiConfirm('确认删除【项目 '+(n+1)+'】\n区域：'+i.area+'\n设施：'+(i.item||'未填写')+'\n说明：'+(i.description||'未填写')+'\n仅删除以上项目，照片引用和备注一起移除。')){deletedItem={item:i,index:n,caseId:c.id};c.items.splice(n,1);renderCase()}});
app.querySelectorAll('[data-state]').forEach(b=>b.onclick=async()=>{try{if(['待审核','已完成'].includes(b.dataset.state)&&!highlightMissing(b.dataset.state==='已完成'))return;await save();let note=b.dataset.state==='退回补充'?uiPrompt('请填写退回原因'):'';if(note===null)return;current=await api('cases/'+c.id+'/transition',{version:current.version,target:b.dataset.state,note});renderCase()}catch(e){error(e)}});
async function uploadPhotos(n,side,files){try{let selected=[...files].filter(f=>f.type.startsWith('image/'));if(!selected.length)throw Error('请拖入图片文件');await save();for(let f of selected){if(f.size>30*1024*1024)throw Error('单张照片不得超过30MB');let img=await createImageBitmap(f),ratio=Math.min(1,1600/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=img.width*ratio;canvas.height=img.height*ratio;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);img.close();let v=await api('cases/'+current.id+'/media',{version:current.version,data:canvas.toDataURL('image/jpeg',.82).split(',')[1]});current.version=v.version;current.items[n][side].push(v.url)}await save();renderCase()}catch(e){error(e)}}
app.querySelectorAll('[data-delete-photo]').forEach(button=>button.onclick=async()=>{let n=+button.dataset.deletePhoto,side=button.dataset.side,index=+button.dataset.photoIndex,item=current.items[n];if(!uiConfirm('删除「'+item.area+' / '+item.item+'」的'+(side==='after'?'本次':'之前')+'照片 '+(index+1)+'？仅移除此照片。'))return;let url=item[side][index],oldPairs=item.photo_pairs;item[side].splice(index,1);item.photo_pairs=(oldPairs||[]).filter(p=>p.after!==url&&p.before!==url);try{await save();renderCase()}catch(e){item[side].splice(index,0,url);item.photo_pairs=oldPairs;error(e)}});
app.querySelectorAll('[data-upload]').forEach(el=>el.onchange=()=>uploadPhotos(+el.dataset.index,el.dataset.upload,el.files));
app.querySelectorAll('[data-drop]').forEach(el=>{el.ondragover=e=>{e.preventDefault();el.classList.add('drag')};el.ondragleave=()=>el.classList.remove('drag');el.ondrop=e=>{e.preventDefault();e.stopPropagation();el.classList.remove('drag');uploadPhotos(+el.dataset.index,el.dataset.drop,e.dataTransfer.files)}});
if(document.getElementById('undo'))document.getElementById('undo').onclick=()=>{current.items.splice(Math.min(deletedItem.index,current.items.length),0,deletedItem.item);deletedItem=null;renderCase()};
app.querySelectorAll('[data-photo]').forEach(el=>el.onclick=()=>{
let i=current.items[+el.dataset.photo],content=document.getElementById('photoContent');
content.innerHTML=['after','before'].map(k=>`<div class="zoom-panel" data-view-side="${k}"><h3>${k==='after'?'本次退租':'之前同位置'}</h3><div class="row"><button data-step="-1">上一张</button><select class="choose-photo" aria-label="选择照片">${i[k].map((p,j)=>`<option value="${j}" ${k===el.dataset.side&&j===+el.dataset.photoIndex?'selected':''}>照片 ${j+1} / ${i[k].length}</option>`).join('')}</select><button data-step="1">下一张</button></div><div class="zoom-controls"><button type="button" data-zoom="out" aria-label="缩小照片">−</button><input type="range" min="50" max="500" step="25" value="100" aria-label="照片缩放比例"><button type="button" data-zoom="in" aria-label="放大照片">＋</button><output>100%</output><button type="button" data-zoom="reset">适应窗口</button></div><p class="help">最高放大5倍；放大后可拖动图片或滚动查看细节。双击图片切换放大。</p><div class="image-scroll">${i[k].length?`<img src="${i[k][k===el.dataset.side?+el.dataset.photoIndex:0]}" alt="对照证据" draggable="false">`:'<p>尚无照片</p>'}</div></div>`).join('');
content.querySelectorAll('.zoom-panel').forEach(panel=>{
let range=panel.querySelector('input'),output=panel.querySelector('output'),viewport=panel.querySelector('.image-scroll'),applied=100;
function zoom(value){let previous=applied,next=Math.max(50,Math.min(500,value));let x=(viewport.scrollLeft+viewport.clientWidth/2)/previous,y=(viewport.scrollTop+viewport.clientHeight/2)/previous;range.value=next;applied=next;output.value=next+'%';viewport.querySelectorAll('img').forEach(img=>{img.style.width=next+'%';img.style.maxWidth='none'});viewport.scrollLeft=x*next-viewport.clientWidth/2;viewport.scrollTop=y*next-viewport.clientHeight/2;viewport.style.setProperty('--zoom',next+'%');viewport.classList.toggle('magnified',next>100)}
let chooser=panel.querySelector('.choose-photo'),side=panel.dataset.viewSide;chooser.onchange=()=>{let img=viewport.querySelector('img');if(img)img.src=i[side][+chooser.value];zoom(100);viewport.scrollTop=0;viewport.scrollLeft=0};panel.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{if(!i[side].length)return;chooser.value=(+chooser.value+(+b.dataset.step)+i[side].length)%i[side].length;chooser.onchange()});range.oninput=()=>zoom(Number(range.value));panel.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>zoom(b.dataset.zoom==='reset'?100:Number(range.value)+(b.dataset.zoom==='in'?25:-25)));
viewport.ondblclick=e=>{if(e.target.tagName==='IMG')zoom(Number(range.value)>100?100:250)};
let drag;viewport.onpointerdown=e=>{if(Number(range.value)<=100||e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');e.preventDefault()};viewport.onpointermove=e=>{if(drag){viewport.scrollLeft=drag.left+drag.x-e.clientX;viewport.scrollTop=drag.top+drag.y-e.clientY}};let end=()=>{drag=null;viewport.classList.remove('panning')};viewport.onpointerup=end;viewport.onpointercancel=end;
});let pairing=document.createElement('div');pairing.className='pairing-actions';pairing.innerHTML='<p>分别选择同角度、同位置的照片，再保存配对。可保留多组不同角度。</p><button id="savePhotoPair">保存当前两张为一组对照</button><span id="pairSaved"></span>';content.append(pairing);let savedPairs=document.createElement('select');savedPairs.setAttribute('aria-label','已保存角度配对');savedPairs.innerHTML='<option value="">选择已保存的配对角度</option>'+(i.photo_pairs||[]).map((pair,n)=>'<option value="'+n+'">配对 '+(n+1)+'：本次照片 '+(i.after.indexOf(pair.after)+1)+' ↔ 之前照片 '+(i.before.indexOf(pair.before)+1)+'</option>').join('');pairing.prepend(savedPairs);savedPairs.onchange=()=>{let pair=(current.items[+el.dataset.photo].photo_pairs||[])[+savedPairs.value];if(savedPairs.value===''||!pair)return;for(let side of ['after','before']){let select=content.querySelector('[data-view-side="'+side+'"] .choose-photo');select.value=i[side].indexOf(pair[side]);select.onchange()}};pairing.querySelector('button').disabled=!editable||!i.after.length||!i.before.length;pairing.querySelector('button').onclick=async()=>{let after=i.after[+content.querySelector('[data-view-side="after"] select').value],before=i.before[+content.querySelector('[data-view-side="before"] select').value];let active=current.items[+el.dataset.photo],pairs=active.photo_pairs||[];if(!pairs.some(p=>p.after===after&&p.before===before))pairs.push({after,before});active.photo_pairs=pairs;try{await save();pairing.querySelector('span').textContent='已保存 '+pairs.length+' 组配对；重新打开可选择';}catch(e){error(e)}};document.getElementById('photoDialog').showModal()});
document.getElementById('audit').onclick=async()=>{try{let v=await api('cases/'+c.id+'/audit');uiAlert(v.events.map(e=>`${new Date(e.created*1000).toLocaleString()} ${e.name} ${e.event} ${e.detail}`).join('\n'))}catch(e){error(e)}};
if(current.archive?.cleaned){for(let id of ['fullArchive','report']){let el=document.getElementById(id);if(el)el.disabled=true}app.querySelectorAll('[data-state]').forEach(el=>el.disabled=true)}
if(document.getElementById('fullArchive'))document.getElementById('fullArchive').onclick=fullArchive;if(document.getElementById('cleanup'))document.getElementById('cleanup').onclick=cleanupPhotos;
if(document.getElementById('report'))document.getElementById('report').onclick=()=>exportReport();
const translateButton = document.getElementById('translateReportEn');
if (translateButton) translateButton.onclick = () => translateReportEnglish(c, translateButton);
}
async function save(){if(current.status==='已完成')return;let saved=await api('cases/'+current.id+'/items',{version:current.version,items:current.items});Object.assign(current,saved)}
function groupDamageReportItems(items) {
    const categories = new Map([
        ['清洁类', new Map()],
        ['维修／损坏类', new Map()],
        ['其他类', new Map()],
    ]);
    for (const item of items) {
        const areas = categories.get(item.report_category) ?? categories.get('其他类');
        if (!areas.has(item.area)) areas.set(item.area, []);
        areas.get(item.area).push(item);
    }
    return [...categories].filter(([, areas]) => areas.size > 0);
}

const englishReportCategories = {
    '清洁类': 'Cleaning',
    '维修／损坏类': 'Repairs and Damage',
    '其他类': 'Other',
};
const englishReportNotes = {
    '无须定损': 'No charge required.',
    '需向租客核实': 'To be confirmed with the tenant.',
    '自然磨损': 'Fair wear and tear.',
};

async function translateReportEnglish(record, button) {
    const fields = [['area', 'area_en'], ['item', 'item_en'], ['cm', 'cm_en']];
    const hasChinese = /\p{Script=Han}/u;
    const tasks = record.items.filter(item => item.decision === '租客责任').flatMap(item =>
        fields.filter(([source, target]) =>
            !item[target]?.trim() && hasChinese.test(item[source] || '') &&
            !(source === 'cm' && englishReportNotes[item.cm])
        ).map(([source, target]) => ({id: item.id, source, target, text: item[source]}))
    );
    if (!tasks.length) {
        uiAlert('当前定损项目没有需要自动填充的英文内容。');
        return;
    }
    if (!globalThis.Translator?.create) {
        uiAlert('此浏览器不支持自动翻译。请使用支持内置翻译的桌面版 Chrome，或手动填写英文。');
        return;
    }

    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = '正在准备翻译…';
    let translator;
    try {
        translator = await globalThis.Translator.create({
            sourceLanguage: 'zh',
            targetLanguage: 'en',
            monitor(monitor) {
                monitor.addEventListener('downloadprogress', event => {
                    button.textContent = '下载翻译模型 ' + Math.round(event.loaded * 100) + '%';
                });
            },
        });
        const translations = new Map();
        for (const task of tasks) {
            if (current !== record || record.status === '已完成') return;
            button.textContent = '正在翻译…';
            if (!translations.has(task.text)) {
                translations.set(task.text, (await translator.translate(task.text)).trim());
            }
        }
        if (current !== record || record.status === '已完成' || !button.isConnected) return;
        let filled = 0;
        for (const task of tasks) {
            const index = record.items.findIndex(item => item.id === task.id);
            const item = record.items[index];
            const translation = translations.get(task.text);
            if (item?.decision !== '租客责任' || item[task.source] !== task.text ||
                item[task.target]?.trim() || !translation || hasChinese.test(translation)) continue;
            const input = app.querySelector('[data-index="'+index+'"] [data-key="'+task.target+'"]');
            if (!input) continue;
            input.value = translation;
            input.oninput();
            filled++;
        }
        uiAlert(filled ? '已填充 '+filled+' 处英文。请在「英文定损报告内容」中校对，再保存或导出。'
                     : '没有可填充的译文。请检查项目或手动填写英文。');
    } catch (err) {
        if (current === record) uiAlert('自动翻译暂不可用。请稍后重试或手动填写英文。');
    } finally {
        translator?.destroy();
        button.disabled = false;
        button.textContent = originalLabel;
    }
}

function englishReportItems(items) {
    const needsTranslation = /\p{Script=Han}/u;
    const missing = [];
    const translated = items.map(item => {
        const area = item.area_en?.trim() || item.area;
        const name = item.item_en?.trim() || item.item;
        const note = item.cm_en?.trim() || englishReportNotes[item.cm] || item.cm;
        const fields = [];
        if (needsTranslation.test(area)) fields.push('英文区域');
        if (needsTranslation.test(name)) fields.push('英文设施名称');
        if (needsTranslation.test(note)) fields.push('英文 CM 对外说明');
        if (fields.length) missing.push(item.area+' / '+item.item+'（'+fields.join('、')+'）');
        return {...item, area, item: name, cm: note};
    });
    if (missing.length) {
        throw Error('请在以下项目的「英文定损报告内容」中补充翻译：\n'+missing.join('\n'));
    }
    return translated;
}

async function exportReport(mode) {
    const full = mode === 'full';
    const english = interfaceLanguage === 'en';
    const preview = window.open('', '_blank');
    if (!preview) { uiAlert('请允许弹出报告窗口后重试'); return; }
    preview.document.write(english ? '<p>Preparing report…</p>' : '<p>正在准备报告…</p>');
    try {
        await save();
        const record = await api('cases/'+current.id+(full?'/full-report':'/report'), full?{version:current.version}:undefined);
        const items = english && !full ? englishReportItems(record.items) : record.items;
        const title = full ? (english ? 'Full Inspection Report (Internal)' : '全部问题报告（内部）') : english ? 'Inspection Damage Report' : '定损报告';
        const labels = english
            ? {current:'Current inspection', previous:'Previous inspection', currentPair:'Current · matched angle', previousPair:'Previous · matched angle', currentOther:'Other current photos', previousOther:'Other previous photos', noCurrent:'No current photo provided', noPrevious:'No previous photo of the same location provided', print:'Print / Save as PDF'}
            : {current:'本次', previous:'之前', currentPair:'本次 · 已配对角度', previousPair:'之前 · 已配对角度', currentOther:'本次其他照片', previousOther:'之前其他照片', noCurrent:'未提供本次照片', noPrevious:'未提供之前同位置照片', print:'打印 / 另存为PDF'};
        let text = `<!doctype html><html lang="${english?'en':'zh-CN'}"><meta charset="utf-8"><title>${title}</title>
            <style>@page{size:A4;margin:14mm}body{font:14px system-ui;max-width:1000px;margin:25px auto;color:#243d31}article{border-bottom:1px solid #ccc;padding:15px 0}p{white-space:pre-wrap}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pair img{width:100%;max-height:300px;object-fit:contain}h3{font-size:14px}.report-category{background:#edf4ef;padding:8px 12px;border-left:4px solid #2e6f56}.report-area{font-size:16px;border-bottom:1px solid #cbdad1;padding-bottom:5px}article h4{margin:0 0 8px;font-size:14px}.report-category,.report-area,article h4{break-after:avoid}@media print{.toolbar{display:none}body{margin:0}.pair{break-inside:avoid}}</style>
            <div class="toolbar"><button onclick="window.print()">${labels.print}</button></div>
            <h1>${title}</h1><h2>${esc(record.address)}</h2>
            <p>${labels.current}: ${esc(record.current)} · ${labels.previous}: ${esc(record.previous)}</p>`;

        async function photo(url) {
            const response = await fetch(url);
            if (!response.ok) throw Error('照片加载失败，不能生成完整报告');
            const blob = await response.blob();
            return new Promise((resolve,reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve('<img src="'+reader.result+'">');
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        const groups = full ? [[null, new Map([[null, items]])]] : groupDamageReportItems(items);
        for (const [category, areas] of groups) {
            if (category) text += '<h2 class="report-category">'+esc(english?englishReportCategories[category]:category)+'</h2>';
            for (const [area, entries] of areas) {
                if (area !== null) text += '<h3 class="report-area">'+esc(area)+'</h3>';
                for (const item of entries) {
                    text += '<article>'+(full?'<h2>'+esc(item.area+' / '+item.item)+'</h2>':'<h4>'+esc(item.item)+'</h4>');
                    if (full) {
                        const headings = english ? ['Issue type', 'Comparison finding', 'Review decision'] : ['类型','比对结论','审核决定'];
                        const details = [item.kind, item.finding, item.decision].map((value, index) =>
                            headings[index]+': '+esc(english?translateInterface(value):value));
                        text += '<p>'+esc(item.description)+'</p><p>'+details.join(' · ')+'</p><p>'+esc(item.junior)+'</p>';
                    }
                    text += '<p>'+esc(item.cm)+'</p><p>'+esc(item.amount?'AUD '+item.amount:'')+'</p>';
                    const used = {after:new Set(),before:new Set()};
                    for (const pair of item.photo_pairs || []) {
                        if (!item.after.includes(pair.after) || !item.before.includes(pair.before)) continue;
                        used.after.add(pair.after);
                        used.before.add(pair.before);
                        text += '<div class="pair"><section><h3>'+labels.currentPair+'</h3>'+await photo(pair.after)+'</section><section><h3>'+labels.previousPair+'</h3>'+await photo(pair.before)+'</section></div>';
                    }
                    text += '<div class="pair">';
                    for (const side of ['after','before']) {
                        text += '<section><h3>'+(side==='after'?labels.currentOther:labels.previousOther)+'</h3>';
                        if (!item[side].length) text += '<p>'+(side==='after'?labels.noCurrent:labels.noPrevious)+'</p>';
                        for (const url of item[side]) if (!used[side].has(url)) text += await photo(url);
                        text += '</section>';
                    }
                    text += '</div></article>';
                }
            }
        }
        if (full) text += '<p>'+(english?'Archive ID: ':'归档编号：')+esc(record.archive_token)+(english?' · Case version: ':' · 案件版本：')+record.version+'</p>';
        preview.document.open();
        preview.document.write(text);
        preview.document.close();
        await Promise.all([...preview.document.images].map(img=>img.decode()));
        preview.focus();
        preview.print();
    } catch (err) {
        preview.close();
        error(err);
    }
}

window.onbeforeunload=()=>current&&current.status!=='已完成'?'请确认已保存修改':undefined;
(async()=>{try{let v=await api('me');user=v.user;csrf=v.csrf;await home()}catch{login()}})();

document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>e.preventDefault());document.getElementById('closePhotos').onclick=()=>document.getElementById('photoDialog').close();

async function accountPage(){
if(user.role!=='admin')return;users=(await api('users')).users;current=null;
shell(`<div class="banner">仅管理员可创建、编辑及启停账号。停用后立即禁止登录，历史比对记录继续保留。</div><div class="panel"><h2>创建团队账号</h2><form id="accountForm"><div class="grid3">${field('accountName','姓名')}${field('accountEmail','登录邮箱','','email')}<div class="field"><label>账号角色</label><select id="accountRole"><option value="junior">Junior CM</option><option value="cm">CM</option></select></div></div><div class="grid2">${field('accountPassword','初始密码（至少8位）','','password')}<div class="field"><label>操作</label><button class="primary" type="submit">创建账号</button></div></div><p id="accountMessage" role="status"></p></form></div><div class="panel"><h2>团队账号 · ${users.length} 人</h2><div class="table-scroll"><table class="case-table"><thead><tr><th>姓名</th><th>邮箱</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>${users.map(u=>`<tr><td data-user-text>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(({admin:'管理员',junior:'Junior CM',cm:'CM'})[u.role])}</td><td>${u.active?'启用':'已停用'}</td><td><button data-user-edit="${u.id}">编辑账号</button> ${u.id!==user.id?`<button data-user-status="${u.id}">${u.active?'停用账号':'启用账号'}</button>`:'当前账号'}</td></tr>`).join('')}</tbody></table></div></div>`);
document.getElementById('accountForm').onsubmit=async e=>{e.preventDefault();let button=e.submitter;button.disabled=true;try{await api('users',{name:val('accountName'),email:val('accountEmail'),role:val('accountRole'),password:val('accountPassword')});await accountPage();document.getElementById('accountMessage').textContent='账号已创建，可使用设置的邮箱和初始密码登录。'}catch(e){error(e);button.disabled=false}};
app.querySelectorAll('[data-user-edit]').forEach(button=>button.onclick=()=>{let target=users.find(v=>v.id===button.dataset.userEdit),dialog=document.getElementById('formDialog');document.getElementById('formContent').innerHTML=`<div class="dialog-head"><strong>编辑账号 · ${esc(target.name)}</strong><button id="closeEdit" type="button">关闭</button></div><form id="editAccountForm">${field('editName','姓名',target.name)}${field('editEmail','登录邮箱',target.email,'email')}${field('editPassword','新密码（至少8位；留空保留原密码）','','password')}<p class="help">修改邮箱或密码后，该账号在其他设备的登录会失效；历史案件归属保持不变。</p><button type="submit" class="primary">保存账号</button></form>`;dialog.showModal();document.getElementById('closeEdit').onclick=()=>dialog.close();document.getElementById('editAccountForm').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{let v=await api('users/'+target.id+'/edit',{name:val('editName'),email:val('editEmail'),password:val('editPassword')});if(target.id===user.id)user=v.user;dialog.close();await accountPage();document.getElementById('accountMessage').textContent='账号修改已保存。'}catch(err){error(err);e.submitter.disabled=false}}});
app.querySelectorAll('[data-user-status]').forEach(button=>button.onclick=async()=>{let u=users.find(v=>v.id===button.dataset.userStatus);if(!uiConfirm((u.active?'停用':'启用')+'账号：'+u.name+'（'+u.email+'）？历史案件不会删除。'))return;try{await api('users/'+u.id+'/status',{active:!u.active});await accountPage()}catch(e){error(e)}});
}

function groupIssues(c){
const host=document.getElementById('issues'),overview=document.getElementById('areaSummary');
const groups=new Map();c.items.forEach((item,index)=>{let area=item.area||'未指定区域';if(!groups.has(area))groups.set(area,[]);groups.get(area).push(index)});
if(!groups.size){overview.innerHTML='<p class="help">尚无问题项目。</p>';return}
const articles=[...host.children];
for(const [area,indexes] of groups){
let key=c.id+':'+area,details=document.createElement('details');details.className='area-group';details.open=areaOpen.get(key)||false;
let pending=indexes.filter(n=>c.items[n].decision==='待审核').length;
let summary=document.createElement('summary');summary.innerHTML=`<span class="area-name" ${area==='未指定区域'?'':'data-user-text'}>${esc(area)}</span><span class="area-count">${indexes.length} 项问题</span><span class="area-review">${pending?'待审核 '+pending+' 项':'已逐项审核'}</span>`;details.append(summary);
let body=document.createElement('div');body.className='area-group-body';indexes.forEach((n,local)=>{let article=articles[n];let title=article.querySelector('h3');title.textContent=area+' · 问题 '+(local+1)+' / '+indexes.length+' · '+(c.items[n].item||'未填写设施');body.append(article)});details.append(body);host.append(details);
details.ontoggle=()=>{areaOpen.set(key,details.open)};
}
}

async function fullArchive(){await exportReport('full')}
async function cleanupPhotos(){try{let receipt=await api('cases/'+current.id+'/archive-status');if(receipt.cleaned){uiAlert('此案件照片已清理。归档位置：'+receipt.location);return}if(!receipt.token||receipt.version!==current.version)throw Error('请先导出当前版本的全部问题报告（PDF）');let dialog=document.getElementById('formDialog');document.getElementById('formContent').innerHTML=`<div class="dialog-head"><strong>确认PDF归档并清理照片</strong><button id="closeCleanup">关闭</button></div><p class="notice">不可撤销。仅清理此案件在系统中的全部照片，保留文字及审核记录。清理后案件只读，不能重新生成带照片的报告。现有服务器备份不受影响。</p><div class="field"><label>选择刚保存的全部问题报告 PDF（确认已保存）</label><input id="archiveFile" type="file" accept=".pdf"></div>${field('archiveLocation','公司归档位置（文件夹路径或内部链接）')}<label><input id="archiveChecked" type="checkbox" style="width:auto"> 我已打开PDF检查全部项目、照片和审核结果，并保存到公司归档位置</label><p><button id="confirmCleanup" class="danger">确认永久清理本案件照片</button></p>`;dialog.showModal();document.getElementById('closeCleanup').onclick=()=>dialog.close();document.getElementById('confirmCleanup').onclick=async e=>{let button=e.target;button.disabled=true;try{let file=document.getElementById('archiveFile').files[0],location=val('archiveLocation').trim();if(!file||!location||!document.getElementById('archiveChecked').checked)throw Error('请选择全部问题PDF、填写保存位置并确认已检查');let hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');if(new TextDecoder().decode((await file.arrayBuffer()).slice(0,5))!=='%PDF-')throw Error('请选择有效PDF文件');if(receipt.sha256!=='PDF-CONFIRM')throw Error('请重新导出全部问题报告PDF');if(!uiConfirm('确定永久清理「'+current.address+'」全部服务器照片？'))return;let v=await api('cases/'+current.id+'/cleanup',{version:current.version,token:receipt.token,sha256:hash,location,confirmed:true});dialog.close();await openCase(current.id);uiAlert('已清理 '+v.deleted_photos+' 张照片。'+(v.space_reclaimed?'数据库空间已回收。':'已删除照片，数据库空间回收需管理员稍后维护。'))}catch(err){error(err)}finally{button.disabled=false}}}catch(e){error(e)}}

function cmChoice(i){let options=['无须定损','需向租客核实','自然磨损','其它'];return i.cm_choice||(options.includes(i.cm)?i.cm:i.cm?'其它':'')}
function highlightMissing(review){app.querySelectorAll('.invalid').forEach(el=>{el.classList.remove('invalid');el.removeAttribute('aria-invalid')});let missing=[];for(let [n,i] of current.items.entries()){let article=app.querySelector('.issue[data-index="'+n+'"]');function mark(el,label){if(!el)return;el.classList.add('invalid');el.setAttribute('aria-invalid','true');missing.push({el,label:'项目 '+(n+1)+'（'+i.area+' / '+(i.item||'未填写设施')+'）：'+label})}for(let k of ['area','item','kind','description','finding'])if(!String(i[k]||'').trim())mark(article.querySelector('[data-key="'+k+'"]'),({area:'区域',item:'设施',kind:'问题类型',description:'问题说明',finding:'比对结论'})[k]);if(!i.after.length)mark(article.querySelector('[data-drop="after"]'),'本次退租照片');if(review){if(!i.decision||i.decision==='待审核')mark(article.querySelector('[data-key="decision"]'),'审核决定');if(!cmChoice(i))mark(article.querySelector('[data-cm-choice]'),'CM对外说明');else if(cmChoice(i)==='其它'&&!String(i.cm_note??i.cm??'').trim())mark(article.querySelector('[data-cm-note]'),'其它说明')}}if(!current.items.length){uiAlert('请先添加问题项目');return false}if(missing.length){for(let entry of missing){let details=entry.el.closest('details');if(details)details.open=true}uiAlert('请补充以下必填项：\n'+missing.map(v=>v.label).join('\n'));missing[0].el.scrollIntoView({behavior:'smooth',block:'center'});missing[0].el.focus();return false}return true}

function editCaseDetails(caseRecord) {
    const dialog = document.getElementById('formDialog');
    const canReassign = user.role === 'admin' || user.role === 'junior';
    const cmOptions = users.filter(person => person.role === 'cm' && (person.active || person.id === caseRecord.cm_id));
    if (!cmOptions.some(person => person.id === caseRecord.cm_id)) {
        cmOptions.unshift({id: caseRecord.cm_id, name: caseRecord.cm_id});
    }
    document.getElementById('formContent').innerHTML = `
        <div class="dialog-head"><strong>编辑案件信息</strong><button type="button" id="closeCaseDetails">关闭</button></div>
        <form id="caseDetailsForm">
            ${field('editCaseAddress','房源地址',caseRecord.address)}
            ${field('editCaseCurrent','本次日期',caseRecord.current,'date')}
            ${field('editCasePrevious','之前日期',caseRecord.previous,'date')}
            <div class="field"><label for="editCaseCM">负责CM</label>
            <select id="editCaseCM" ${canReassign?'':'disabled'}>
                ${cmOptions.map(person => `<option value="${esc(person.id)}" ${person.id===caseRecord.cm_id?'selected':''}>${esc(person.name)}</option>`).join('')}
            </select></div>
            ${canReassign?'':'<p class="help">如需更换负责CM，请联系管理员。</p>'}
            <button type="submit" class="primary">保存案件信息</button>
        </form>`;
    document.getElementById('closeCaseDetails').onclick = () => dialog.close();
    document.getElementById('caseDetailsForm').onsubmit = async event => {
        event.preventDefault();
        const button = event.submitter;
        button.disabled = true;
        try {
            const saved = await api('cases/'+caseRecord.id+'/details', {
                version: caseRecord.version,
                address: val('editCaseAddress'),
                current: val('editCaseCurrent'),
                previous: val('editCasePrevious'),
                cm_id: val('editCaseCM'),
            });
            for (const key of ['address','current','previous','cm_id','version','updated']) {
                caseRecord[key] = saved[key];
            }
            dialog.close();
            renderCase();
        } catch (err) {
            error(err);
        } finally {
            button.disabled = false;
        }
    };
    dialog.showModal();
}

async function deleteCase(caseRecord) {
    if (!uiConfirm('确认删除案件「'+caseRecord.address+'」？删除后案件将从工作台移除。')) return;
    const button = document.getElementById('deleteCase');
    button.disabled = true;
    try {
        await api('cases/'+caseRecord.id+'/delete', {version:caseRecord.version});
        await home();
    } catch (err) {
        error(err);
    } finally {
        button.disabled = false;
    }
}

document.addEventListener('change', event => {
    if (event.target.matches('[data-interface-language]')) setInterfaceLanguage(event.target.value);
});
const interfaceObserver = new MutationObserver(localizeInterface);
for (const root of [app, document.getElementById('photoDialog'), document.getElementById('formDialog')]) {
    interfaceObserver.observe(root, {subtree:true, childList:true, characterData:true});
}
localizeInterface();
