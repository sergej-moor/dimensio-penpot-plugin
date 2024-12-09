<div class="flex justify-center items-center w-full p-4">
  <div class="animate-[spin_1.5s_ease-in-out_infinite] rounded-full h-6 w-6">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="theme-colored-spinner"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  </div>
</div>

<style>
  :global([data-theme='light']) .theme-colored-spinner {
    stroke: var(--la-primary);
  }

  :global([data-theme='dark']) .theme-colored-spinner {
    stroke: var(--da-primary);
  }
</style>
