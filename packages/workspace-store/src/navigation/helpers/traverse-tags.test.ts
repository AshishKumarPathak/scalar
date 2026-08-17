import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { assert, describe, expect, it } from 'vitest'

import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { TraversedEntry, TraversedTag } from '@/schemas/navigation'
import type { OpenApiDocument, TagObject } from '@/schemas/v3.1/strict/openapi-document'

import { traverseTags } from './traverse-tags'

type TagGroup = { name: string; tags: string[] }

describe('traverseTags', () => {
  // Helper function to create a mock OpenAPI document
  const createMockDocument = (tagGroups?: TagGroup[]): OpenApiDocument => ({
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    ...(tagGroups && { 'x-tagGroups': tagGroups }),
    'x-scalar-original-document-hash': '',
  })

  // Helper function to create a mock tag
  const createMockTag = (name: string, displayName?: string): TagObject => ({
    name,
    ...(displayName && { 'x-displayName': displayName }),
  })

  // Helper function to create a mock sidebar entry
  const createMockEntry = (title: string, method?: HttpMethod): TraversedEntry => ({
    id: `entry-${title}`,
    title,
    method: method ?? 'get',
    type: 'operation',
    path: '',
    ref: '',
  })

  it('should handle empty tags map', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map()

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
      },
    })
    expect(result).toEqual([])
  })

  it('should return empty tags', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'empty-tag',
        {
          id: 'tag/empty-tag',
          parentId: 'doc-1',
          tag: createMockTag('empty-tag'),
          entries: [],
        },
      ],
      [
        'tag-with-entries',
        {
          id: 'tag/tag-with-entries',
          parentId: 'doc-1',
          tag: createMockTag('tag-with-entries'),
          entries: [createMockEntry('Test Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
      },
    })

    expect(result).toHaveLength(2)
    assert(result[0]?.type === 'tag')
    expect(result[0]?.name).toBe('empty-tag')
    expect(result[0]?.children).toEqual([])
    assert(result[1]?.type === 'tag')
    expect(result[1]?.name).toBe('tag-with-entries')
    expect(result[1]?.children).toHaveLength(1)
  })

  it('should handle single default tag', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('Test Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
    })
    // Default tag is now treated like any other tag (not flattened)
    expect(result).toEqual([
      {
        type: 'tag',
        id: 'default',
        title: 'default',
        name: 'default',
        isWebhooks: false,
        description: undefined,
        children: [createMockEntry('Test Operation')],
        isGroup: false,
        xKeys: {
          'x-scalar-order': ['entry-Test Operation'],
        },
      },
    ])
  })

  it('should handle a mix of tags and default tag', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('Test Operation')],
        },
      ],
      [
        'tag1',
        { id: 'tag/tag1', parentId: 'doc-1', tag: createMockTag('tag1'), entries: [createMockEntry('Test Operation')] },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
    })
    expect(result).toEqual([
      {
        type: 'tag',
        id: 'default',
        title: 'default',
        name: 'default',
        isWebhooks: false,
        description: undefined,
        children: [createMockEntry('Test Operation')],
        isGroup: false,
        xKeys: {
          'x-scalar-order': ['entry-Test Operation'],
        },
      },
      {
        type: 'tag',
        id: 'tag1',
        title: 'tag1',
        name: 'tag1',
        isWebhooks: false,
        description: undefined,
        children: [createMockEntry('Test Operation')],
        isGroup: false,
        xKeys: {
          'x-scalar-order': ['entry-Test Operation'],
        },
      },
    ])
  })

  it('should sort tags alphabetically', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'zebra',
        {
          id: 'tag/zebra',
          parentId: 'doc-1',
          tag: createMockTag('zebra'),
          entries: [createMockEntry('Zebra Operation')],
        },
      ],
      [
        'alpha',
        {
          id: 'tag/alpha',
          parentId: 'doc-1',
          tag: createMockTag('alpha'),
          entries: [createMockEntry('Alpha Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.title).toBe('alpha')
    expect(result[1]?.title).toBe('zebra')
  })

  it('should handle tag groups', () => {
    const tagGroups: TagGroup[] = [
      {
        name: 'Group A',
        tags: ['tag1', 'tag2'],
      },
    ]
    const document = createMockDocument(tagGroups)
    const tagsMap: TagsMap = new Map([
      [
        'tag1',
        { id: 'tag/tag1', parentId: 'doc-1', tag: createMockTag('tag1'), entries: [createMockEntry('Operation 1')] },
      ],
      [
        'tag2',
        { id: 'tag/tag2', parentId: 'doc-1', tag: createMockTag('tag2'), entries: [createMockEntry('Operation 2')] },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Group A')
    expect((result[0] as TraversedTag).children).toHaveLength(2)
  })

  it('should sort operations by HTTP method', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.type).toBe('tag')
    expect(result[0]?.title).toBe('default')
    assert(result[0]?.type === 'tag')
    expect(result[0]?.children).toHaveLength(2)
    assert(result[0]?.children?.[0]?.type === 'operation')
    assert(result[0]?.children?.[1]?.type === 'operation')
    expect(result[0]?.children?.[0].method).toBe('get')
    expect(result[0]?.children?.[1].method).toBe('post')
  })

  it('should handle custom operationSorter using [deprecated] httpVerb', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')],
        },
      ],
    ])
    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: (a: { httpVerb: string }, b: { httpVerb: string }) =>
          (a.httpVerb || '').localeCompare(b.httpVerb || ''),

        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.type).toBe('tag')
    expect(result[0]?.title).toBe('default')
    assert(result[0]?.type === 'tag')
    expect(result[0]?.children).toHaveLength(2)
    assert(result[0]?.children?.[0]?.type === 'operation')
    assert(result[0]?.children?.[1]?.type === 'operation')
    expect(result[0]?.children?.[0].method).toBe('get')
    expect(result[0]?.children?.[1].method).toBe('post')
  })

  it('should handle custom tag sorter', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'tag1',
        {
          id: 'tag/tag1',
          parentId: 'doc-1',
          tag: createMockTag('tag1', 'Zebra'),
          entries: [createMockEntry('Operation 1')],
        },
      ],
      [
        'tag2',
        {
          id: 'tag/tag2',
          parentId: 'doc-1',
          tag: createMockTag('tag2', 'Alpha'),
          entries: [createMockEntry('Operation 2')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: (a: TagObject, b: TagObject) => (a['x-displayName'] ?? '').localeCompare(b['x-displayName'] || ''),
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.title).toBe('Alpha')
    expect(result[1]?.title).toBe('Zebra')
  })

  it('should handle custom operations sorter', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('Operation B', 'post'), createMockEntry('Operation A', 'get')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: (a: { method: string }, b: { method: string }) =>
          (a.method || '').localeCompare(b.method || ''),
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('default')
    assert(result[0]?.type === 'tag')
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children?.[0]?.title).toBe('Operation A')
    expect(result[0].children?.[1]?.title).toBe('Operation B')
  })

  it('should handle internal tags', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'internal',
        {
          id: 'tag/internal',
          parentId: 'doc-1',
          tag: { ...createMockTag('internal'), 'x-internal': true },
          entries: [createMockEntry('Internal Operation')],
        },
      ],
      [
        'public',
        {
          id: 'tag/public',
          parentId: 'doc-1',
          tag: createMockTag('public'),
          entries: [createMockEntry('Public Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('public')
  })

  it('should handle scalar-ignore tags', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'ignored',
        {
          id: 'tag/ignored',
          parentId: 'doc-1',
          tag: { ...createMockTag('ignored'), 'x-scalar-ignore': true },
          entries: [createMockEntry('Ignored Operation')],
        },
      ],
      [
        'visible',
        {
          id: 'tag/visible',
          parentId: 'doc-1',
          tag: createMockTag('visible'),
          entries: [createMockEntry('Visible Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('visible')
  })

  describe('OpenAPI 3.2 parent-based nesting', () => {
    const generateId = (props: Parameters<TraverseSpecOptions['generateId']>[0]) =>
      props.type === 'tag' ? (props.tag.name ?? '') : 'unknown-id'

    it('nests a child tag inside its parent', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        tags: [{ name: 'Catalog' }, { name: 'Payer Catalog', parent: 'Catalog' } as TagObject & { parent: string }],
        'x-scalar-original-document-hash': '',
      }

      const tagsMap: TagsMap = new Map([
        [
          'Catalog',
          {
            id: 'Catalog',
            parentId: 'doc-1',
            tag: { name: 'Catalog' },
            entries: [createMockEntry('List Catalogs')],
          },
        ],
        [
          'Payer Catalog',
          {
            id: 'Payer Catalog',
            parentId: 'doc-1',
            tag: { name: 'Payer Catalog', parent: 'Catalog' } as TagObject & { parent: string },
            entries: [createMockEntry('Get Payer Catalog')],
          },
        ],
      ])

      const result = traverseTags({ document, tagsMap, documentId: 'doc-1', options: { generateId } })

      // Only the parent tag should be at the top level
      expect(result).toHaveLength(1)
      assert(result[0]?.type === 'tag')
      expect(result[0].name).toBe('Catalog')

      // The child tag should be nested inside the parent's children
      const children = result[0].children ?? []
      const childTag = children.find((c) => c.type === 'tag' && c.name === 'Payer Catalog')
      expect(childTag).toBeDefined()
      assert(childTag?.type === 'tag')
      expect(childTag.children).toHaveLength(1)
      expect(childTag.children?.[0]?.title).toBe('Get Payer Catalog')
    })

    it('supports multiple children under the same parent', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        tags: [
          { name: 'Catalog' },
          { name: 'Payer Catalog', parent: 'Catalog' } as TagObject & { parent: string },
          { name: 'Provider Catalog', parent: 'Catalog' } as TagObject & { parent: string },
        ],
        'x-scalar-original-document-hash': '',
      }

      const tagsMap: TagsMap = new Map([
        ['Catalog', { id: 'Catalog', parentId: 'doc-1', tag: { name: 'Catalog' }, entries: [] }],
        [
          'Payer Catalog',
          {
            id: 'Payer Catalog',
            parentId: 'doc-1',
            tag: { name: 'Payer Catalog', parent: 'Catalog' } as TagObject & { parent: string },
            entries: [createMockEntry('Get Payer')],
          },
        ],
        [
          'Provider Catalog',
          {
            id: 'Provider Catalog',
            parentId: 'doc-1',
            tag: { name: 'Provider Catalog', parent: 'Catalog' } as TagObject & { parent: string },
            entries: [createMockEntry('Get Provider')],
          },
        ],
      ])

      const result = traverseTags({ document, tagsMap, documentId: 'doc-1', options: { generateId } })

      expect(result).toHaveLength(1)
      assert(result[0]?.type === 'tag')
      const nestedTags = (result[0].children ?? []).filter((c) => c.type === 'tag')
      expect(nestedTags).toHaveLength(2)
      expect(nestedTags.map((t) => t.title)).toContain('Payer Catalog')
      expect(nestedTags.map((t) => t.title)).toContain('Provider Catalog')
    })

    it('leaves tags without parent at the top level', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        tags: [
          { name: 'Standalone' },
          { name: 'Parent' },
          { name: 'Child', parent: 'Parent' } as TagObject & { parent: string },
        ],
        'x-scalar-original-document-hash': '',
      }

      const tagsMap: TagsMap = new Map([
        [
          'Standalone',
          { id: 'Standalone', parentId: 'doc-1', tag: { name: 'Standalone' }, entries: [createMockEntry('Op A')] },
        ],
        ['Parent', { id: 'Parent', parentId: 'doc-1', tag: { name: 'Parent' }, entries: [] }],
        [
          'Child',
          {
            id: 'Child',
            parentId: 'doc-1',
            tag: { name: 'Child', parent: 'Parent' } as TagObject & { parent: string },
            entries: [createMockEntry('Op B')],
          },
        ],
      ])

      const result = traverseTags({ document, tagsMap, documentId: 'doc-1', options: { generateId } })

      // Standalone and Parent at top level; Child nested inside Parent
      expect(result).toHaveLength(2)
      const names = result.map((r) => r.title)
      expect(names).toContain('Standalone')
      expect(names).toContain('Parent')
      expect(names).not.toContain('Child')
    })

    it('ignores a parent reference that does not exist in the document', () => {
      const document: OpenApiDocument = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        tags: [{ name: 'Orphan', parent: 'NonExistent' } as TagObject & { parent: string }],
        'x-scalar-original-document-hash': '',
      }

      const tagsMap: TagsMap = new Map([
        [
          'Orphan',
          {
            id: 'Orphan',
            parentId: 'doc-1',
            tag: { name: 'Orphan', parent: 'NonExistent' } as TagObject & { parent: string },
            entries: [createMockEntry('Op')],
          },
        ],
      ])

      const result = traverseTags({ document, tagsMap, documentId: 'doc-1', options: { generateId } })

      // Orphan stays at top level since its parent doesn't exist
      expect(result).toHaveLength(1)
      expect(result[0]?.title).toBe('Orphan')
    })

    it('is fully backward compatible when no parent fields are present', () => {
      const document = createMockDocument()
      const tagsMap: TagsMap = new Map([
        ['tag-a', { id: 'tag-a', parentId: 'doc-1', tag: { name: 'tag-a' }, entries: [createMockEntry('Op A')] }],
        ['tag-b', { id: 'tag-b', parentId: 'doc-1', tag: { name: 'tag-b' }, entries: [createMockEntry('Op B')] }],
      ])

      const result = traverseTags({ document, tagsMap, documentId: 'doc-1', options: { generateId } })

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.title)).toEqual(['tag-a', 'tag-b'])
    })
  })
})
