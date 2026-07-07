const fs = require('fs');

let html = fs.readFileSync('Frontend/pages/branches.html', 'utf-8');
const addressInput = `
                            <div class="form-floating mb-3">
                                <input type="text" class="form-control" id="branchAddress" required>
                                <label>Dirección Física</label>
                            </div>`;
const newInputs = `
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="number" step="any" class="form-control" id="branchLatitude">
                                        <label>Latitud (Opcional)</label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="number" step="any" class="form-control" id="branchLongitude">
                                        <label>Longitud (Opcional)</label>
                                    </div>
                                </div>
                            </div>
`;
if (!html.includes('id="branchLatitude"')) {
    html = html.replace(addressInput, addressInput + newInputs);
    fs.writeFileSync('Frontend/pages/branches.html', html, 'utf-8');
    console.log("Patched branches.html");
}

let js = fs.readFileSync('Frontend/pages/branches.js', 'utf-8');
js = js.replace('document.getElementById(\'branchAddress\').value = branch.address || \'\';', `document.getElementById('branchAddress').value = branch.address || '';
    document.getElementById('branchLatitude').value = branch.latitude || '';
    document.getElementById('branchLongitude').value = branch.longitude || '';`);

js = js.replace('address: document.getElementById(\'branchAddress\').value,', `address: document.getElementById('branchAddress').value,
            latitude: document.getElementById('branchLatitude').value ? parseFloat(document.getElementById('branchLatitude').value) : null,
            longitude: document.getElementById('branchLongitude').value ? parseFloat(document.getElementById('branchLongitude').value) : null,`);

fs.writeFileSync('Frontend/pages/branches.js', js, 'utf-8');
console.log("Patched branches.js");
