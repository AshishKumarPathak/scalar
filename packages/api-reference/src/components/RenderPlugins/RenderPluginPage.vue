<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'

import { usePluginManager } from '@/plugins'

const { viewName, options, pageSlug } = defineProps<{
  viewName: 'content.start' | 'content.end'
  options: Record<string, any>
  pageSlug: string
}>()

const { getPageViewComponents } = usePluginManager()
const pageComponents = getPageViewComponents(viewName).filter((p) => p.slug === pageSlug)
</script>

<template>
  <template v-if="pageComponents.length">
    <div class="plugin-page-view">
      <template
        v-for="(item, _index) in pageComponents"
        :key="_index">
        <ScalarErrorBoundary>
          <div :id="`plugin-page-${pageSlug}`">
            <template v-if="item.renderer">
              <component
                :is="item.renderer"
                v-bind="{
                  component: item.component,
                  options,
                  ...item.props,
                }" />
            </template>
            <template v-else>
              <component
                :is="item.component"
                v-bind="{ options, ...item.props }" />
            </template>
          </div>
        </ScalarErrorBoundary>
      </template>
    </div>
  </template>
</template>
