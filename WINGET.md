# WinGet publishing

WinGet installs a standalone `bytifi.exe` from GitHub Releases — no Node.js required on Windows.

Manifests live in the separate fork: https://github.com/jpwcguy/bytifiwingetfork

## 1. Build and release

Tag must match the package version:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Build locally on Windows:

```powershell
npm run build:win
```

Upload `dist/bytifi.exe` to a GitHub Release for that tag.

## 2. Get the installer SHA256

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

In **bytifiwingetfork**, edit `manifests/b/Bytifi/Bytifi/0.1.1/Bytifi.Bytifi.installer.yaml` and set `InstallerSha256` to the hash (uppercase hex).

Or use [wingetcreate](https://github.com/microsoft/winget-create):

```powershell
wingetcreate update Bytifi.Bytifi --version 0.1.1 --url https://github.com/jpwcguy/Bytifi/releases/download/v0.1.1/bytifi.exe
```

## 4. Submit to winget-pkgs

1. Fork https://github.com/microsoft/winget-pkgs
2. Copy the manifest folder from **bytifiwingetfork** into your fork
3. Open a pull request

After Microsoft merges the PR, users can install with:

```powershell
winget install Bytifi.Bytifi
bytifi upload C:\path\to\file.iso
```

## New versions

1. Bump `version` in `package.json`
2. `npm publish`
3. Copy the manifest folder to the new version path in **bytifiwingetfork** (e.g. `0.1.2/`)
4. Tag, release, update SHA256, submit winget PR
