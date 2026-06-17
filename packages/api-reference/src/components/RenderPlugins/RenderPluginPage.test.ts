import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import RenderPluginPage from './RenderPluginPage.vue'

vi.mock('@/plugins', () => ({
  usePluginManager: vi.fn(),
}))

import { usePluginManager } from '@/plugins'

describe('RenderPluginPage', () => {
  const mockOptions = { theme: 'dark', layout: 'modern' }

  const createMockPluginManager = (pageComponents: any[] = []) => ({
    getViewComponents: vi.fn().mockReturnValue([]),
    getPageViewComponents: vi.fn().mockReturnValue(pageComponents),
    getSpecificationExtensions: vi.fn(),
    notifyInit: vi.fn(),
    notifyConfigChange: vi.fn(),
    notifyDestroy: vi.fn(),
    getApiClientPlugins: vi.fn().mockReturnValue([]),
    getSidebarEntries: vi.fn().mockReturnValue([]),
  })

  describe('rendering', () => {
    it('renders nothing when no page components match the slug', () => {
      vi.mocked(usePluginManager).mockReturnValue(createMockPluginManager([]))

      const wrapper = mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'non-existent',
        },
      })

      expect(wrapper.find('.plugin-page-view').exists()).toBe(false)
    })

    it('renders a Vue component matching the page slug', () => {
      const PageComponent = {
        name: 'PageComponent',
        template: '<div class="custom-page">Custom Page Content</div>',
        props: ['options'],
      }

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          { component: PageComponent, slug: 'my-page' },
        ]),
      )

      const wrapper = mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'my-page',
        },
      })

      expect(wrapper.find('.plugin-page-view').exists()).toBe(true)
      expect(wrapper.find('.custom-page').exists()).toBe(true)
      expect(wrapper.find('.custom-page').text()).toBe('Custom Page Content')
    })

    it('renders with custom renderer', () => {
      const CustomRenderer = {
        name: 'CustomRenderer',
        template: '<div class="custom-renderer">Rendered</div>',
        props: ['component', 'options'],
      }

      const MockComponent = 'MockReactComponent'

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          { component: MockComponent, renderer: CustomRenderer, slug: 'react-page' },
        ]),
      )

      const wrapper = mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'react-page',
        },
      })

      expect(wrapper.find('.plugin-page-view').exists()).toBe(true)
      expect(wrapper.find('.custom-renderer').exists()).toBe(true)
    })

    it('only renders the component matching the slug', () => {
      const PageA = {
        name: 'PageA',
        template: '<div class="page-a">Page A</div>',
        props: ['options'],
      }
      const PageB = {
        name: 'PageB',
        template: '<div class="page-b">Page B</div>',
        props: ['options'],
      }

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          { component: PageA, slug: 'page-a' },
          { component: PageB, slug: 'page-b' },
        ]),
      )

      const wrapper = mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'page-a',
        },
      })

      expect(wrapper.find('.page-a').exists()).toBe(true)
      expect(wrapper.find('.page-b').exists()).toBe(false)
    })
  })

  describe('props handling', () => {
    it('passes options to the page component', () => {
      const receivedProps: any = {}

      const PageComponent = {
        name: 'PageComponent',
        template: '<div class="page">Page</div>',
        props: ['options'],
        setup(props: any) {
          receivedProps.options = props.options
          return {}
        },
      }

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          { component: PageComponent, slug: 'test-page' },
        ]),
      )

      mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'test-page',
        },
      })

      expect(receivedProps.options).toStrictEqual(mockOptions)
    })

    it('passes additional props to the page component', () => {
      const receivedProps: any = {}

      const PageComponent = {
        name: 'PageComponent',
        template: '<div class="page">Page</div>',
        props: ['options', 'theme', 'customData'],
        setup(props: any) {
          receivedProps.theme = props.theme
          receivedProps.customData = props.customData
          return {}
        },
      }

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          {
            component: PageComponent,
            slug: 'test-page',
            props: { theme: 'light', customData: { key: 'value' } },
          },
        ]),
      )

      mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'test-page',
        },
      })

      expect(receivedProps.theme).toBe('light')
      expect(receivedProps.customData).toStrictEqual({ key: 'value' })
    })

    it('passes component and options to custom renderer', () => {
      const receivedProps: any = {}

      const CustomRenderer = {
        name: 'CustomRenderer',
        template: '<div class="renderer">Rendered</div>',
        props: ['component', 'options'],
        setup(props: any) {
          receivedProps.component = props.component
          receivedProps.options = props.options
          return {}
        },
      }

      const MockComponent = 'ReactComponent'

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          { component: MockComponent, renderer: CustomRenderer, slug: 'react-page' },
        ]),
      )

      mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'react-page',
        },
      })

      expect(receivedProps.component).toBe(MockComponent)
      expect(receivedProps.options).toStrictEqual(mockOptions)
    })
  })

  describe('view name handling', () => {
    it('calls getPageViewComponents with correct view name', () => {
      const getPageViewComponentsMock = vi.fn().mockReturnValue([])

      vi.mocked(usePluginManager).mockReturnValue({
        ...createMockPluginManager(),
        getPageViewComponents: getPageViewComponentsMock,
      })

      mount(RenderPluginPage, {
        props: {
          viewName: 'content.start',
          options: mockOptions,
          pageSlug: 'test',
        },
      })

      expect(getPageViewComponentsMock).toHaveBeenCalledWith('content.start')
    })
  })

  describe('DOM structure', () => {
    it('sets correct id on the page container', () => {
      const PageComponent = {
        name: 'PageComponent',
        template: '<div>Page</div>',
        props: ['options'],
      }

      vi.mocked(usePluginManager).mockReturnValue(
        createMockPluginManager([
          { component: PageComponent, slug: 'my-custom-page' },
        ]),
      )

      const wrapper = mount(RenderPluginPage, {
        props: {
          viewName: 'content.end',
          options: mockOptions,
          pageSlug: 'my-custom-page',
        },
      })

      expect(wrapper.find('#plugin-page-my-custom-page').exists()).toBe(true)
    })
  })
})
