<script lang="ts">
  import { objectStore, updateObjectSettings } from '../stores/object';
  import type { ObjectSettings } from '../stores/object';
  import { tooltip } from '../actions/tooltip';

  function handleSettingChange(setting: keyof ObjectSettings, value: number) {
    updateObjectSettings({ [setting]: value });
  }
</script>

<div class="flex flex-col gap-4">
  <h3 class="text-sm font-medium">Object Settings</h3>

  <div class="flex flex-col gap-2">
    <label class="text-sm flex justify-between">
      Depth: {$objectStore.settings.depth.toFixed(0)}
      <input
        type="range"
        min="1"
        max="20"
        step="1"
        value={$objectStore.settings.depth}
        on:input={(e) =>
          handleSettingChange('depth', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
        use:tooltip={{
          text: 'Adjust the extrusion depth of the object',
          position: 'left',
        }}
      />
    </label>

    <label class="text-sm flex justify-between">
      Scale: {$objectStore.settings.scale.toFixed(2)}
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={$objectStore.settings.scale}
        on:input={(e) =>
          handleSettingChange('scale', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
        use:tooltip={{
          text: 'Adjust the overall scale of the object',
          position: 'left',
        }}
      />
    </label>

    <label class="text-sm flex justify-between">
      Curve Segments: {$objectStore.settings.curveSegments}
      <input
        type="range"
        min="1"
        max="32"
        step="1"
        value={$objectStore.settings.curveSegments}
        on:input={(e) =>
          handleSettingChange('curveSegments', parseInt(e.currentTarget.value))}
        class="flex-1 ml-2"
        use:tooltip={{
          text: 'Adjust the smoothness of curves',
          position: 'left',
        }}
      />
    </label>

    <label class="text-sm flex justify-between">
      Steps: {$objectStore.settings.steps}
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={$objectStore.settings.steps}
        on:input={(e) =>
          handleSettingChange('steps', parseInt(e.currentTarget.value))}
        class="flex-1 ml-2"
        use:tooltip={{
          text: 'Adjust the number of extrusion steps',
          position: 'left',
        }}
      />
    </label>
  </div>
</div>
