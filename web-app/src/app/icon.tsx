import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d4af37', // Gold Foil
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="24"
          height="24"
        >
          <path d="M12 2C11.5 2 11 2.5 10.5 3C9 4.5 8.5 6.5 9 8C7.5 7.5 5.5 8 4 9.5C3.5 10 3.5 10.5 4 11C5 12 6.5 12 7.5 11.5C7 13 7 14.5 7.5 16C8 17.5 9.5 18.5 11 19V21C11 21.6 11.4 22 12 22C12.6 22 13 21.6 13 21V19C14.5 18.5 16 17.5 16.5 16C17 14.5 17 13 16.5 11.5C17.5 12 19 12 20 11C20.5 10.5 20.5 10 20 9.5C18.5 8 16.5 7.5 15 8C15.5 6.5 15 4.5 13.5 3C13 2.5 12.5 2 12 2ZM12 4.2C12.8 5.2 13.2 6.5 12.9 7.8C11.6 7.5 10.3 7.9 9.3 8.7C10.1 7.1 11 5.6 12 4.2ZM7.7 10.8C8.5 11.8 9.8 12.2 11.1 11.9C9.8 11.6 8.5 11.2 7.7 10.8ZM16.3 10.8C15.5 11.2 14.2 11.6 12.9 11.9C14.2 12.2 15.5 11.8 16.3 10.8ZM12 14C11.1 14 10.2 14.3 9.5 14.8C10.5 15.6 11.6 16.1 12 16.8C12.4 16.1 13.5 15.6 14.5 14.8C13.8 14.3 12.9 14 12 14Z" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
