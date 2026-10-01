/**
 * TOOL BUNDLER: Đóng gói bài học từ mã nguồn Local sang File HTML độc lập (Self-contained Base64)
 * Cách dùng: node bundle.js [tên_file.html]
 * Kết quả: Xuất file độc lập vào thư mục dist/
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'Bai_07_1_Khong_lo_va_Ti_hon.html';
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Không tìm thấy file: ${inputFile}`);
  process.exit(1);
}

console.log(`🚀 Đang đóng gói: ${inputFile}...`);

let html = fs.readFileSync(inputFile, 'utf8');
const lines = html.split('\n');

// 1. Encode Images
const anhIdx = lines.findIndex(l => l.includes('const ANH = {'));
if (anhIdx >= 0) {
  const line = lines[anhIdx];
  const jsonStr = line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1);
  const anh = JSON.parse(jsonStr);
  const bundledAnh = {};
  for (const [k, p] of Object.entries(anh)) {
    if (fs.existsSync(p)) {
      const ext = path.extname(p).slice(1) || 'webp';
      const b64 = fs.readFileSync(p).toString('base64');
      bundledAnh[k] = `data:image/${ext};base64,${b64}`;
    } else {
      bundledAnh[k] = p;
    }
  }
  lines[anhIdx] = 'const ANH = ' + JSON.stringify(bundledAnh) + ';';
  console.log('  ✔ Đã mã hóa ảnh WebP thành Base64');
}

// 2. Encode Audio
const hashesIdx = lines.findIndex(l => l.includes('const NHUNG_HASHES = ['));
const giongIdx = lines.findIndex(l => l.includes('const GIONG = Object.fromEntries'));
if (hashesIdx >= 0) {
  const line = lines[hashesIdx];
  const jsonStr = line.substring(line.indexOf('['), line.lastIndexOf(']') + 1);
  const hashes = JSON.parse(jsonStr);
  
  const nhungLines = {};
  hashes.forEach((h, idx) => {
    const audioPath = path.join('audio', `${h}.mp3`);
    if (fs.existsSync(audioPath)) {
      const b64 = fs.readFileSync(audioPath).toString('base64');
      nhungLines[`A_${idx + 1}`] = {
        h: h,
        src: `data:audio/mpeg;base64,${b64}`
      };
    }
  });

  lines[hashesIdx] = 'const NHUNG = ' + JSON.stringify({ lines: nhungLines }) + ';';
  if (giongIdx >= 0) {
    lines[giongIdx] = 'const GIONG = {}; if(NHUNG) for(const v of Object.values(NHUNG.lines)) GIONG[v.h] = v.src;';
  }
  console.log(`  ✔ Đã mã hóa ${Object.keys(nhungLines).length} file audio MP3 thành Base64`);
}

// 3. Xuất file ra dist/
fs.mkdirSync('dist', { recursive: true });
const outputFilename = path.basename(inputFile, '.html') + '.standalone.html';
const outputPath = path.join('dist', outputFilename);
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
console.log(`✅ Đóng gói thành công: ${outputPath} (${sizeMB} MB)`);
