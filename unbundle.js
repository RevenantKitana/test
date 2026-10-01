/**
 * TOOL UNBUNDLER: Trích xuất Base64 từ file HTML độc lập ra các file Audio / Image rời
 * Cách dùng: node unbundle.js [file_chua_base64.html]
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'Bai_07_1_Khong_lo_va_Ti_hon.html';
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Không tìm thấy file: ${inputFile}`);
  process.exit(1);
}

console.log(`📦 Đang bóc tách Base64 từ: ${inputFile}...`);

fs.mkdirSync('audio', { recursive: true });
fs.mkdirSync('images', { recursive: true });

const raw = fs.readFileSync(inputFile, 'utf8');
const lines = raw.split('\n');

// 1. Trích xuất Images
const anhLineIdx = lines.findIndex(l => l.startsWith('const ANH = {') && l.includes('data:image'));
if (anhLineIdx >= 0) {
  const line = lines[anhLineIdx];
  const jsonStr = line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1);
  const anh = JSON.parse(jsonStr);
  const newAnh = {};
  for (const [k, v] of Object.entries(anh)) {
    if (v.startsWith('data:image')) {
      const b64Data = v.replace(/^data:image\/\w+;base64,/, '');
      const outPath = path.join('images', k + '.webp');
      fs.writeFileSync(outPath, Buffer.from(b64Data, 'base64'));
      newAnh[k] = 'images/' + k + '.webp';
    } else {
      newAnh[k] = v;
    }
  }
  lines[anhLineIdx] = 'const ANH = ' + JSON.stringify(newAnh) + ';';
  console.log('  ✔ Đã xuất ảnh ra thư mục images/');
}

// 2. Trích xuất Audio
const nhungLineIdx = lines.findIndex(l => l.startsWith('const NHUNG = {') && l.includes('data:audio'));
if (nhungLineIdx >= 0) {
  const line = lines[nhungLineIdx];
  const jsonStr = line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1);
  const nhung = JSON.parse(jsonStr);
  const hashes = [];
  for (const [k, v] of Object.entries(nhung.lines)) {
    const b64Data = v.src.replace(/^data:audio\/\w+;base64,/, '');
    const outPath = path.join('audio', v.h + '.mp3');
    fs.writeFileSync(outPath, Buffer.from(b64Data, 'base64'));
    hashes.push(v.h);
  }
  console.log(`  ✔ Đã xuất ${hashes.length} file âm thanh ra thư mục audio/`);
  lines[nhungLineIdx] = 'const NHUNG_HASHES = ' + JSON.stringify(hashes) + ';';
}

// Update GIONG initialization
const giongLineIdx = lines.findIndex(l => l.includes('const GIONG = {}; if(NHUNG)'));
if (giongLineIdx >= 0) {
  lines[giongLineIdx] = 'const GIONG = Object.fromEntries(NHUNG_HASHES.map(h => [h, "audio/" + h + ".mp3"]));';
}

fs.writeFileSync(inputFile, lines.join('\n'), 'utf8');
const sizeKB = (fs.statSync(inputFile).size / 1024).toFixed(2);
console.log(`✅ Hoàn tất! File nguồn đã được thu gọn về: ${sizeKB} KB`);
