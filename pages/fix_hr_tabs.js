const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'hr.html');
let content = fs.readFileSync(file, 'utf-8');

const afterTable = `
                    </div> <!-- End of expedientes -->
                    <div class="tab-pane fade" id="asistencia" role="tabpanel">
                        <div class="card border-0 shadow-sm text-center p-5 mt-4">
                            <h4 class="mb-4">Reloj Biométrico Web</h4>
                            <div class="display-1 fw-bold text-primary mb-4" id="clock-display">00:00:00</div>
                            <div class="mb-4">
                                <select class="form-select w-50 mx-auto" id="attendanceEmployeeSelect">
                                    <option value="">Selecciona tu usuario...</option>
                                </select>
                            </div>
                            <button class="btn btn-success btn-lg px-5 rounded-pill shadow-sm" onclick="registerAttendance()">
                                <i class="bi bi-fingerprint me-2"></i> REGISTRAR ENTRADA/SALIDA
                            </button>
                            <div id="attendance-message" class="mt-3 fw-bold"></div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="nomina" role="tabpanel">
                        <div class="card border-0 shadow-sm mt-4">
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th class="ps-4">Periodo Inicio</th>
                                                <th>Periodo Fin</th>
                                                <th>Fecha Proceso</th>
                                                <th class="text-end pe-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="payroll-runs-body">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> <!-- End of hrTabsContent -->
`;

content = content.replace('                    </div>\n                </div>\n            </div>\n        </main>', '                    </div>\n                </div>' + afterTable + '\n            </div>\n        </main>');

fs.writeFileSync(file, content);
console.log("Fixed hr.html missing tabs");
