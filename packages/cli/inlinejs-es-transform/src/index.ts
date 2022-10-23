import { transformSync, minifySync } from '@swc/core'
import type { JscTarget, JsMinifyOptions } from '@swc/core'
import type { Node } from 'posthtml'

export function transformCode(
  code: string,
  target: JscTarget = 'es5',
  minify = false
) {
  return transformSync(code, {
    jsc: {
      target
    },
    minify
  }).code
}

export function minifyCode(code: string, ops?: JsMinifyOptions) {
  return minifySync(code, {
    compress: false,
    mangle: false,
    ...ops
  }).code
}

export function posthtmlSWCTransform(
  target: JscTarget = 'es5',
  minify = false
) {
  return (tree: Node) => {
    tree.match({ tag: 'script' }, (node) => {
      if (node?.content?.[0]) {
        node.content[0] = transformCode(
          node.content[0].toString(),
          target,
          minify
        )
      }
      return node
    })
  }
}

export function posthtmlSWCMinify(ops?: JsMinifyOptions) {
  return (tree: Node) => {
    tree.match({ tag: 'script' }, (node) => {
      if (node?.content?.[0]) {
        node.content[0] = minifyCode(node.content[0].toString(), ops)
      }
      return node
    })
  }
}
