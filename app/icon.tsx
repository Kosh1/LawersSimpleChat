import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#fafaf5',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            border: '3px solid #982525',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#982525',
          }}
        >
          Д
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
