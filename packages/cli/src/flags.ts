export interface CliFlags {
  print: boolean;
  model: string | null;
  verbose: boolean;
  config: string | null;
  headless: boolean;
  session: string | null;
  continue: boolean;
  args: string[];
}

export function parseFlags(argv: string[] = process.argv.slice(2)): CliFlags {
  const flags: CliFlags = {
    print: false,
    model: null,
    verbose: false,
    config: null,
    headless: false,
    session: null,
    continue: false,
    args: [],
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    switch (arg) {
      case '--print':
      case '-p':
        flags.print = true;
        break;
      case '--verbose':
        flags.verbose = true;
        break;
      case '--headless':
        flags.headless = true;
        break;
      case '--continue':
        flags.continue = true;
        break;
      case '--model':
        i++;
        flags.model = argv[i] ?? null;
        break;
      case '--config':
        i++;
        flags.config = argv[i] ?? null;
        break;
      case '--session':
        i++;
        flags.session = argv[i] ?? null;
        break;
      default:
        if (arg.startsWith('--model=')) {
          flags.model = arg.slice('--model='.length);
        } else if (arg.startsWith('--config=')) {
          flags.config = arg.slice('--config='.length);
        } else if (arg.startsWith('--session=')) {
          flags.session = arg.slice('--session='.length);
        } else {
          flags.args.push(arg);
        }
        break;
    }

    i++;
  }

  return flags;
}
