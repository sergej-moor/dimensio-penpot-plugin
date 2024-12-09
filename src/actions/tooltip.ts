interface TooltipParams {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
  textClass?: string;
}

export const tooltip = (
  node: HTMLElement,
  param: TooltipParams
): { update: (params: TooltipParams) => void; destroy: () => void } => {
  let updatedText: string;
  const { text, textClass } = param;
  let { position = 'top', maxWidth = 'max-w-xs' } = param;

  function handleMouseEnter(event: Event): void {
    if (!(event.target instanceof HTMLElement)) return;
    event.stopPropagation();
    const existingTooltip = document.querySelector('.js-tooltip');
    if (existingTooltip) existingTooltip.remove();
    render(event.target as HTMLElement);
  }

  const render = (target: HTMLElement): void => {
    const span = document.createElement('span');
    span.classList.add(
      'js-tooltip',
      'invisible',
      'opacity-0',
      'transition-all',
      'duration-200',
      'delay-700',
      'ease-in-out',
      'pointer-events-none',
      'flex',
      'text-xs',
      'normal-case',
      'fixed',
      'z-50'
    );

    // Determine if we're in dark mode
    const isDarkMode =
      document.querySelector('main')?.getAttribute('data-theme') === 'dark';

    // Create the tooltip content first
    span.innerHTML = `
      <span
        style="
          width: max-content;
          color: ${isDarkMode ? 'var(--df-primary)' : 'var(--lf-primary)'};
          background: ${
            isDarkMode ? 'var(--db-secondary)' : 'var(--lb-secondary)'
          };
        "
        class="js-tooltip-content flex shadow-md rounded-md normal-case break-words ${maxWidth}
        px-2 py-1 ${textClass || ''}"
      >
        ${updatedText || text}
      </span>
    `;

    document.body.appendChild(span);

    // Calculate position based on target's position in viewport
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = span.getBoundingClientRect();

    // Calculate position
    let top = 0;
    let left = 0;

    span.style.transform = 'scale(0.95)';

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 8;
        break;
    }

    // Apply positioning
    span.style.top = `${top}px`;
    span.style.left = `${left}px`;

    // Use requestAnimationFrame to ensure the initial state is rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (span) {
          span.classList.remove('invisible', 'opacity-0');
          span.classList.add('visible', 'opacity-100');
          span.style.transform = 'scale(1)';
        }
      });
    });
  };

  const handleLeave = (event: Event): void => {
    if (!(event.target instanceof HTMLElement)) return;
    const tooltip = document.querySelector('.js-tooltip');
    if (tooltip instanceof HTMLElement) {
      tooltip.classList.add('opacity-0', 'invisible');
      tooltip.classList.remove('visible');
      tooltip.style.transform = 'scale(0.95)';
    }

    setTimeout(() => {
      const tooltip = document.querySelector('.js-tooltip');
      if (tooltip) tooltip.remove();
    }, 200);
  };

  node.addEventListener('mouseenter', handleMouseEnter);
  node.addEventListener('mouseleave', handleLeave);

  return {
    update: ({
      text,
      position: newPosition,
      maxWidth: newMaxWidth,
    }: TooltipParams): void => {
      if (text) updatedText = text;
      if (newPosition) position = newPosition;
      if (newMaxWidth) maxWidth = newMaxWidth;

      const tooltip = document.querySelector('.js-tooltip-content');
      if (
        tooltip instanceof HTMLElement &&
        text &&
        tooltip.textContent !== text
      ) {
        tooltip.textContent = text;
      }
    },
    destroy(): void {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleLeave);
    },
  };
};
