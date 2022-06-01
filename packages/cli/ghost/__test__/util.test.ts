import { readFileSync } from 'fs'
import path from 'path'
import { findGhost } from '../src/index'
import {
  scanDirFiles,
  getPkgNameBySourcePath,
  getFileImportSource,
  getVueFileImportSource,
  getCssFileImportSource,
  getJsFileImportSource,
  isExclude,
  isValidNodeModulesSource,
  isValidPkgName
} from '../src/util'

const testProject = path.join(__dirname, './testProject')

test('findGhost', () => {
  const ghost1 = findGhost(
    path.join(testProject, 'src'),
    path.join(testProject, 'package.json')
  )
  expect(ghost1.length).toBe(5)
  expect(ghost1).toEqual([
    '@vue/test-utils',
    'vuex',
    'vue-router',
    'dayjs',
    'react'
  ])

  const ghost2 = findGhost(
    path.join(testProject, 'src'),
    path.join(testProject, 'package.json'),
    { includeNodeLib: true }
  )
  expect(ghost2.length).toBe(6)
  expect(ghost2).toEqual([
    '@vue/test-utils',
    'vuex',
    'vue-router',
    'dayjs',
    'fs',
    'react'
  ])

  const ghost3 = findGhost(
    path.join(testProject, 'src'),
    path.join(testProject, 'package.json'),
    { includeNodeLib: false, exclude: [/vue/] }
  )
  expect(ghost3.length).toBe(2)
  expect(ghost3).toEqual(['dayjs', 'react'])
})

test('scanDirFiles', () => {
  expect(scanDirFiles(testProject).length).toBe(8)
  expect(scanDirFiles(testProject, ['.ts']).length).toBe(1)
  expect(scanDirFiles(testProject, ['.tsx']).length).toBe(1)
  expect(scanDirFiles(testProject, []).length).toBe(8)
  expect(scanDirFiles(testProject, [], /\.vue$/).length).toBe(6)
})

test('getPkgNameBySourcePath', () => {
  expect(getPkgNameBySourcePath('fs')).toBe('fs')
  expect(getPkgNameBySourcePath('@vue/ssr')).toBe('@vue/ssr')
  expect(getPkgNameBySourcePath('vue/dist/index.js')).toBe('vue')
  expect(getPkgNameBySourcePath('../node_modules/vue')).toBe('vue')
  expect(getPkgNameBySourcePath('dayjs/plugin/timezone')).toBe('dayjs')
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

test('getVueFileImportSource', () => {
  const vue2Data = readFileSync(
    path.join(testProject, 'src/index-vue2.vue'),
    'utf-8'
  )
  expect(getVueFileImportSource(vue2Data)).toEqual([
    '@vue/test-utils',
    'element-ui',
    '@/constants',
    '@/utils/excel',
    '@/styles/index.scss',
    'element-ui/lib/theme-chalk/index.scss'
  ])
  const vue3Data = readFileSync(
    path.join(testProject, 'src/index-vue3.vue'),
    'utf-8'
  )
  expect(getVueFileImportSource(vue3Data)).toEqual([
    'vue',
    'vuex',
    'element-plus',
    './assets/styles/app.css'
  ])
})

test('getCssFileImportSource', () => {
  const cssData = readFileSync(
    path.join(testProject, 'src/index.scss'),
    'utf-8'
  )
  expect(getCssFileImportSource(cssData)).toEqual(['./assets/styles/app.css'])
})

test('getJsFileImportSource', () => {
  const jsData = readFileSync(path.join(testProject, 'src/index.jsx'), 'utf-8')
  expect(getJsFileImportSource(jsData)).toEqual(['react'])
})

test('isExclude', () => {
  expect(isExclude('vue', '')).toBe(false)
  expect(isExclude('vue', 'b')).toBe(false)
  expect(isExclude('vue', 'v')).toBe(true)
  expect(isExclude('vue-router', /vue$/)).toBe(false)
  expect(isExclude('vue-router', [/vue$/, /^vue/])).toBe(true)
})

test('isValidNodeModulesSource', () => {
  expect(isValidNodeModulesSource(__dirname, 'vue')).toBe(true)
  expect(isValidNodeModulesSource(__dirname, 'src')).toBe(false)
  expect(isValidNodeModulesSource(__dirname, 'dayjs/plugin/utc')).toBe(true)
})

test('isValidPkgName', () => {
  expect(isValidPkgName('vue')).toBe(true)
  expect(isValidPkgName('some-package')).toBe(true)
  expect(isValidPkgName('example.com')).toBe(true)
  expect(isValidPkgName('under_score')).toBe(true)
  expect(isValidPkgName('123numeric')).toBe(true)
  expect(isValidPkgName('@npm/thingy')).toBe(true)
  expect(isValidPkgName('@jane/foo.js')).toBe(true)
  expect(isValidPkgName('r.resolve("custom-token.js")')).toBe(false)
  expect(isValidPkgName('dayjs/dsds/abc.js')).toBe(false)
})
