import path from 'path'
import { findGhost } from '../src/index'
import {
  scanDirFiles,
  getPkgNameBySourcePath,
  getFileImportSource
} from '../src/util'

test('findGhost', () => {
  const ghost = findGhost(
    path.join(__dirname, '../', 'src'),
    path.join(__dirname, '../', 'package.json')
  )
  expect(ghost.length).toBe(2)
  expect(ghost).toEqual(['fs', 'path'])
})

test('scanDirFiles', () => {
  expect(scanDirFiles(path.join(__dirname)).length).toBe(1)
  expect(scanDirFiles(path.join(__dirname), ['.ts']).length).toBe(1)
  expect(scanDirFiles(path.join(__dirname), ['.ts'], 'test').length).toBe(0)
  expect(scanDirFiles(path.join(__dirname), []).length).toBe(1)
  expect(scanDirFiles(path.join(__dirname), [], /^util/).length).toBe(1)
})

test('getPkgNameBySourcePath', () => {
  expect(getPkgNameBySourcePath('fs')).toBe('fs')
  expect(getPkgNameBySourcePath('@vue/ssr')).toBe('@vue/ssr')
  expect(getPkgNameBySourcePath('vue/dist/index.js')).toBe('vue')
  expect(getPkgNameBySourcePath('../node_modules/vue')).toBe('vue')
  expect(getPkgNameBySourcePath('~@element/ui/dist/index.css')).toBe(
    '@element/ui'
  )
})
test('getFileImportSource', () => {
  expect(getFileImportSource('import { a } from "fs"', '.ts')).toEqual(['fs'])
  expect(getFileImportSource('export { a } from "fs"', '.ts')).toEqual(['fs'])
  expect(getFileImportSource('import("fs")', '.ts')).toEqual(['fs'])
  expect(getFileImportSource('require("fs")', '.ts')).toEqual(['fs'])
  expect(
    getFileImportSource(
      `<template>
      <router-view></router-view>
    </template>
    
    <script lang="ts">
    import { defineComponent } from 'vue'
    
    export default defineComponent({
      name: 'App'
    })
    </script>
    
  <style>
  @import '~@element/ui/dist/index.css'
  </style>
  `,
      '.vue'
    )
  ).toEqual(['vue', '~@element/ui/dist/index.css'])
})
