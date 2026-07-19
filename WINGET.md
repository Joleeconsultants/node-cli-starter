# WinGet publishing

WinGet installs a standalone `bytifi.exe` from GitHub Releases — no Node.js required on Windows.

## 1. Create a GitHub release

Tag must match the package version:

```bash
git tag v0.1.1
git push origin v0.1.1
```

The **Release** workflow builds `bytifi.exe` on Windows and attaches it to the GitHub release.

## 2. Get the installer SHA256

After the release finishes, download the asset and hash it:

**PowerShell (Windows):**
```powershell
(Invoke-WebRequest -Uri "https://github.com/jpwcguy/Bytifi/releases/download/v0.1.1/bytifi.exe" -OutFile bytifi.exe).StatusCode | Out-Null
Get-FileHash bytifi.exe -Algorithm SHA256
```

**Linux:**
```bash
curl -L -o bytifi.exe https://github.com/jpwcguy/Bytifi/releases/download/v0.1.1/bytifi.exe
sha256sum bytifi.exe
```

## 3. Update the manifest

Edit `winget/manifests/b/Bytifi/Bytifi/0.1.1/Bytifi.Bytifi.installer.yaml` and replace `REPLACE_WITH_SHA256_AFTER_RELEASE` with the hash (uppercase hex, no spaces).

Or use [wingetcreate](https://github.com/microsoft/winget-create):

```powershell
wingetcreate update Bytifi.Bytifi --version 0.1.1 --url https://github.com/jpwcguy/Bytifi/releases/download/v0.1.1/bytifi.exe
```

## 4. Submit to winget-pkgs

1. Fork https://github.com/microsoft/winget-pkgs
2. Copy the folder `winget/manifests/b/Bytifi/Bytifi/0.1.1/` to `manifests/b/Bytifi/Bytifi/0.1.1/` in your fork
3. Open a pull request

After Microsoft merges the PR, users can install with:

```powershell
winget install Bytifi.Bytifi
bytifi upload C:\path\to\file.iso
```

## New versions

1. Bump `version` in `package.json`
2. `npm publish`
3. Copy the manifest folder to the new version path (e.g. `0.1.2/`)
4. Tag `v0.1.2`, push, wait for release, update SHA256, submit winget PR
