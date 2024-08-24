module.exports = {
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        slideUp: {
          '0%': { maxHeight: '100px', opacity: '1' },
          '100%': { maxHeight: '0', opacity: '0' },
        },
        slideDown: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '100px', opacity: '1' },
        },
        slideOutAndUp: {
          '0%': {
            maxHeight: '100px',
            transform: 'translateX(0)',
            opacity: '1',
          },

          '70%': {
            maxHeight: '100px',
          },
          '100%': {
            maxHeight: '0',
            transform: 'translateX(-100%)',
            opacity: '0',
          },
        },
      },
      animation: {
        slideIn: 'slideIn 300ms ease-out forwards',
        slideOut: 'slideOut 300ms ease-in forwards',
        slideUp: 'slideUp 300ms ease-out forwards',
        slideDown: 'slideDown 300ms ease-in forwards',
        slideOutAndUp: 'slideOutAndUp 300ms ease-out forwards',
      },
    },
  },
  variants: {},
  plugins: [],
};
