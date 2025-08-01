import { setActivePinia, createPinia } from 'pinia'
import { useDocsStore } from '@/stores/docs'
import { describe, it, expect, beforeEach } from 'vitest'

describe('docs store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a new document when uploadDoc is called', () => {
    const store = useDocsStore()
    store.uploadDoc('Sample.pdf', 'user')
    expect(store.docs).toHaveLength(1)
    expect(store.docs[0].name).toBe('Sample.pdf')
    expect(store.docs[0].uploadedBy).toBe('user')
  })
})
