import { gen } from './cli/gen';
import { help } from './cli/help';
import { closeIO } from './cli/helpers';
import { initProject } from './cli/init-project';

async function main() {
  try {
    const mode = process.argv[2];
    switch (mode) {
      case 'init':
        await initProject();
        break;
      case 'gen':
        await gen();
        break;
      case 'help':
      default:
        help();
    }
  } catch (e) {
    console.error(e);
    process.exit(0);
  } finally {
    closeIO();
  }
}

main();
