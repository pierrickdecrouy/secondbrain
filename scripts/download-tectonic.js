import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import os from 'os';

const VERSION = '0.15.0';
const REPO = 'tectonic-typesetting/tectonic';

const PLATFORM_MAP = {
    win32: {
        x64: `tectonic-${VERSION}-x86_64-pc-windows-msvc.zip`
    },
    darwin: {
        x64: `tectonic-${VERSION}-x86_64-apple-darwin.tar.gz`,
        arm64: `tectonic-${VERSION}-aarch64-apple-darwin.tar.gz`
    },
    linux: {
        x64: `tectonic-${VERSION}-x86_64-unknown-linux-gnu.tar.gz`,
        arm64: `tectonic-${VERSION}-aarch64-unknown-linux-gnu.tar.gz`
    }
};

const getAssetFilename = () => {
    const platform = os.platform();
    const arch = os.arch();

    const platformConfig = PLATFORM_MAP[platform];
    if (!platformConfig) {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const assetName = platformConfig[arch];
    if (!assetName) {
        throw new Error(`Unsupported architecture ${arch} for platform ${platform}`);
    }

    return assetName;
};

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        
        const request = https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });

        request.on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

const extractFile = (filePath, destDir) => {
    console.log(`Extracting ${filePath} to ${destDir}...`);
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    if (filePath.endsWith('.zip')) {
        // Assume Windows (has tar/unzip built-in on recent versions, or use powershell)
        try {
            execSync(`tar -xf "${filePath}" -C "${destDir}"`, { stdio: 'inherit' });
        } catch (e) {
            execSync(`powershell -command "Expand-Archive -Force '${filePath}' '${destDir}'"`, { stdio: 'inherit' });
        }
    } else if (filePath.endsWith('.tar.gz')) {
        // macOS / Linux
        execSync(`tar -xzf "${filePath}" -C "${destDir}"`, { stdio: 'inherit' });
    } else {
        throw new Error(`Unsupported archive format: ${filePath}`);
    }
};

const main = async () => {
    try {
        const assetName = getAssetFilename();
        const url = `https://github.com/${REPO}/releases/download/tectonic%40${VERSION}/${assetName}`;
        
        const resourcesDir = path.join(process.cwd(), 'resources', 'bin');
        if (!fs.existsSync(resourcesDir)) {
            fs.mkdirSync(resourcesDir, { recursive: true });
        }

        const tectonicPath = path.join(resourcesDir, os.platform() === 'win32' ? 'tectonic.exe' : 'tectonic');
        if (fs.existsSync(tectonicPath)) {
            console.log('Tectonic binary already exists. Skipping download.');
            return;
        }

        const archivePath = path.join(os.tmpdir(), assetName);
        console.log(`Downloading Tectonic ${VERSION} for ${os.platform()} ${os.arch()}...`);
        console.log(`URL: ${url}`);
        
        await downloadFile(url, archivePath);
        
        extractFile(archivePath, resourcesDir);
        
        // Ensure it is executable
        if (os.platform() !== 'win32') {
            execSync(`chmod +x "${tectonicPath}"`);
        }
        
        // Clean up
        fs.unlinkSync(archivePath);
        
        console.log('Tectonic downloaded and extracted successfully.');
    } catch (error) {
        console.error('Error downloading Tectonic:', error);
        process.exit(1);
    }
};

main();
