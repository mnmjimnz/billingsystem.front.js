import os, re
css_path = 'assets/css/devextreme-theme.css'
with open(css_path, 'a', encoding='utf-8') as f:
    f.write('\n\n/* Mobile Notification Dropdown Fix */\n@media (max-width: 576px) {\n    #notif-list {\n        position: fixed !important;\n        top: 65px !important;\n        left: 15px !important;\n        right: 15px !important;\n        width: auto !important;\n        max-width: none !important;\n    }\n}\n')

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to match the button structure
    pattern = re.compile(
        r'<button class="btn position-relative border-0 bg-transparent text-body" type="button" data-bs-toggle="dropdown" onclick="loadNotifications\(\)">\s*'
        r'<i class="bi bi-bell fs-5"></i>\s*'
        r'<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="notif-badge" style="display:none; font-size: 0\.65em;"></span>\s*'
        r'</button>', re.DOTALL)
    
    replacement = '''<button class="btn border-0 bg-transparent text-body p-2" type="button" data-bs-toggle="dropdown" onclick="loadNotifications()">
                            <div class="position-relative d-inline-block">
                                <i class="bi bi-bell fs-5"></i>
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="notif-badge" style="display:none; font-size: 0.6em; transform: translate(-30%, -30%) !important;"></span>
                            </div>
                        </button>'''
    
    new_content = pattern.sub(replacement, content)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

for root, _, files in os.walk('pages'):
    for file in files:
        if file.endswith('.html'):
            replace_in_file(os.path.join(root, file))
if os.path.exists('index.html'):
    replace_in_file('index.html')
