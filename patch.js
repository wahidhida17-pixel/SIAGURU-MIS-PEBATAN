const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/settings/SchoolSettings.tsx', 'utf8');

const target = `            </Card>
          </div>

          {/* Tanda Tangan Digital Kepala Sekolah */}`;

const addition = `            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Icon Aplikasi PWA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Icon Aplikasi (PWA / Mobile)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ikon persegi (resolusi 512x512) untuk ikon aplikasi di perangkat seluler (Home Screen).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  label="Icon Aplikasi (1:1)"
                  sublabel="Disarankan rasio 1:1 format PNG atau WebP."
                  value={formData.appIconURL || ''}
                  onChange={(val) => handleChange('appIconURL', val)}
                  placeholderText="Unggah icon aplikasi"
                />
              </CardContent>
            </Card>

            {/* Favicon Browser */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Favicon Website (Browser)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ikon kecil yang muncul di tab browser Anda (resolusi 32x32 atau 64x64 disarankan).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  label="Favicon (1:1)"
                  sublabel="Disarankan rasio 1:1 format PNG / ICO."
                  value={formData.faviconURL || ''}
                  onChange={(val) => handleChange('faviconURL', val)}
                  placeholderText="Unggah favicon browser"
                />
              </CardContent>
            </Card>
          </div>

          {/* Tanda Tangan Digital Kepala Sekolah */}`;

const result = content.replace(target, addition);
fs.writeFileSync('src/pages/admin/settings/SchoolSettings.tsx', result, 'utf8');
