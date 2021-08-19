# Batch coordinates converter
Accepts a CSV file with either a single column containing the entire coordinate or two columns split into latitude and longitude in that order. Headers will be left untouched.

The output will be a UTF-8 encoded CSV file using `,` (comma) as the separator and `"` as the quote character.

## "Dependencies"
`Papaparse` for parsing and unparsing the input CSV. A copy of the minified `js` file is included.

