import path from 'path'
import fs from 'fs-extra'
import { glob, runTypeChain } from 'typechain'
import {
  CompilationOutput,
  CompileFailedError,
  compileSol,
} from 'solc-typed-ast'

// No top level await??? Troubles making it work.
;(async () => {
  const dirs = {
    input: path.resolve(process.cwd(), 'src'),
    output: path.resolve(process.cwd(), 'dist'),
  }

  // Delete output dir
  await fs.remove(dirs.output)

  // Read contracts
  const sourceFiles = await fs.readdir(dirs.input)

  try {
    for (const file of sourceFiles) {
      // Parse only file name, no extension
      const fileName = path.parse(file).name

      // Compile contract
      let result = compileSol(
        path.resolve(dirs.input, file),
        '0.8.10',
        [],
        [CompilationOutput.ABI, CompilationOutput.EVM_BYTECODE]
      )

      // Make sure output dir exists
      await fs.ensureDir(dirs.output)

      // Write the compiler output as json file
      await fs.outputJSON(
        path.resolve(dirs.output, `${fileName}.json`),
        result.data.contracts[path.resolve(dirs.input, file)][fileName]
      )
    }
  } catch (e) {
    if (e instanceof CompileFailedError) {
      console.error('Compilation failed.')
    }
  }

  try {
    // Generate types
    const artifactFiles = glob(dirs.output, ['**/*.json'])

    await runTypeChain({
      cwd: dirs.output,
      filesToProcess: artifactFiles,
      allFiles: artifactFiles,
      outDir: path.resolve(dirs.output, '@types'),
      target: 'web3-v1',
    })
  } catch {
    console.log('Failed to generate typings.')
  }
})()
