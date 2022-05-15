import path from 'path'
import { findGhost } from '../src/index'

test('findGhost', () => {
  const ghost = findGhost(
    path.join(__dirname, '../', 'src'),
    path.join(__dirname, '../', 'package.json')
  )
  expect(ghost.length).toBe(2)
  expect(ghost).toEqual(['fs', 'path'])
})
