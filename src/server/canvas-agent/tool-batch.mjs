// A model decision is not a transaction. Each browser write remains atomic;
// only revisions proven to belong to earlier successful writes in this decision
// may be forwarded. Never retry against an arbitrary latest browser revision.
export const MAX_CANVAS_DECISION_TOOLS = 16
const pendingBatches = new WeakMap()
export const CANVAS_MUTATION_TOOLS = new Set(['canvas_create', 'canvas_edit', 'canvas_patch_widget', 'canvas_revert','penecho_present_widget','penecho_draw','penecho_plot','penecho_patch_file','penecho_edit_canvas','penecho_upload_image','penecho_place_image'])
const mutations = CANVAS_MUTATION_TOOLS

export function createCanvasDecisionBatch(session) {
  const known=[session?.stateDigest?.revision,session?.canvasCommittedRevision].filter(Number.isSafeInteger)
  const revision = known.length?Math.max(...known):undefined
  return { baseRevision:revision, revision, failed:false }
}

export function registerCanvasDecisionBatch(session, calls) {
  const batch = createCanvasDecisionBatch(session)
  pendingBatches.set(session, new Map(calls.map(call => [String(call.id), batch])))
  return batch
}

// Schema/authorization failures can occur before the tool's execute wrapper.
export function recordCanvasBatchToolResult(session, exec, result) {
  const pending=pendingBatches.get(session),id=String(exec?.callId||''),batch=pending?.get(id)
  if(batch&&mutations.has(exec.name)&&result?.isError)batch.failed=true
  pending?.delete(id)
}

export async function executeCanvasBatchTool(session, name, args, exec, execute) {
  const pending = pendingBatches.get(session), id = String(exec?.callId || '')
  const batch = exec?.canvasDecisionBatch || pending?.get(id)
  pending?.delete(id)
  if (!mutations.has(name)) return execute(args, exec)
  const commit=async submitted=>{
    const result=await execute(submitted,exec)
    // A browser digest can arrive after its tool receipt. A capture immediately
    // following the write must never reuse an image keyed to the older digest.
    if(result?.ok!==false&&!result?.isError&&!result?.terminal){
      session.captureCache?.clear()
      if(Number.isSafeInteger(result?.revision))session.canvasCommittedRevision=Math.max(session.canvasCommittedRevision??0,result.revision)
    }
    return result
  }
  if (!batch) return commit(args)
  if (batch.failed) {
    const error = new Error('An earlier write in this decision failed or its revision could not be verified. Inspect the current state before submitting further writes; successful earlier changes are preserved.')
    error.code = 'CANVAS_BATCH_WRITE_STOPPED'
    throw error
  }
  // Shared document tools enforce their own source hashes, stable artifact IDs
  // and request receipts. Never substitute a guessed revision into that API.
  if(name.startsWith('penecho_')) {
    try { return await commit(args) }
    catch(error) { batch.failed=true; throw error }
  }
  let submitted = args
  // Source hashes are object-scoped and must never be rewritten, even when a
  // sibling patch changed the same object. The browser checks them at commit.
  if (!args.sourceHash && Number.isSafeInteger(batch.baseRevision)
    && args.baseRevision === batch.baseRevision && batch.revision !== batch.baseRevision) {
    submitted = { ...args, baseRevision:batch.revision }
  }
  try {
    const result = await commit(submitted)
    if (result?.terminal || result?.ok === false || result?.isError) batch.failed = true
    else if (Number.isSafeInteger(result?.revision)) {
      const guardedBase = args.sourceHash || name === 'canvas_revert'
        ? result.previousRevision : submitted.baseRevision
      if (guardedBase === batch.revision && result.revision === batch.revision + 1) batch.revision = result.revision
      else if (result.revision !== batch.revision) batch.failed = true
    } else batch.failed = true
    return result
  } catch (error) {
    batch.failed = true
    throw error
  }
}
