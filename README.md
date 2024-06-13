# JLPT N5 Grammar

This repository contains scripts for parsing and exporting JLPT N5 grammar data.

## Project Structure

- `src/`: Source code directory
  - `index.mjs`: Main script for parsing grammar data
  - `export.mjs`: Script for exporting parsed data to TSV format
  - `pages/`: Directory containing HTML pages with grammar data
- `__tests__/`: Directory containing test files

## Scripts

- `start`: Run the main parsing script
- `export`: Run the export script
- `test`: Run the test suite

## Usage

1. Clone the repository
2. Install dependencies (yarn is recommended)
3. Run the main parsing script with `npm start`
4. Run the export script with `npm run export`

## Testing

Run the test suite with `npm test`.

After making any changes that introduce changes into the start script output, jest snapshots update is needed. This can be achieved by running the test command with `--updateSnapshot` flag.

```sh
npm test -- --updateSnapshot
```

## License

MIT
