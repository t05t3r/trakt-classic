export function showUsage() {
  console.log(
    'Usage: generate-i18n -i <meta-dir> [-o <output-dir>] [options]',
  );
  console.log('');
  console.log('Options:');
  console.log('  --input, -i      Meta directory (required)');
  console.log('  --output, -o     Output directory (./.output/generated)');
  console.log('  --platforms, -p  Comma-separated platforms (web)');
  console.log('  --watch, -w      Watch for file changes and regenerate');
  console.log('  --help, -h       Show this help');
  console.log('');
  console.log('Examples:');
  console.log(
    '  generate-i18n -i meta/ (processes all .json files in the directory)',
  );
  console.log('  generate-i18n -i meta/ -o ./output');
  console.log('  generate-i18n -i meta/ -o ./output --platforms web');
  console.log('  generate-i18n -i meta/ --watch');
}
