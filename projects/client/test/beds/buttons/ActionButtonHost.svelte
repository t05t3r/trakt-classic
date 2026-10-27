<script lang="ts">
  import ActionButton from '$lib/components/buttons/ActionButton.svelte';
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';

  type ActionButtonHostProps = {
    onclick: () => void;
    onside: (key: string) => void;
  };

  const { onclick, onside }: ActionButtonHostProps = $props();
</script>

<ActionButton
  color="watch"
  icon={IconCheck}
  label="Add to history"
  selected={false}
  {onclick}
>
  {#snippet side()}
    <ActionSideIcon
      icon={IconCirclePlus}
      label="Add another play"
      onclick={() => onside('play')}
    />
    <ActionSideIcon
      icon={IconCircleMinus}
      label="Drop"
      onclick={() => onside('drop')}
    />
  {/snippet}
</ActionButton>
