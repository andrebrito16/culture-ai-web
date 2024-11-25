/* eslint-disable @next/next/no-sync-scripts */
'use client'

export default function VrPage() {
  return (
    <html>
      <head>
        <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
        <script src="https://quadjr.github.io/aframe-gaussian-splatting/index.js"></script>
      </head>
      <body>
      {/* @ts-expect-error - Error */}
        <a-scene renderer="antialias: false" stats>
         {/* @ts-expect-error - Error */}
          <a-entity position="0 1.6 -2.0" animation="property: rotation; to: 0 360 0; dur: 10000; easing: linear; loop: true">
             {/* @ts-expect-error - Error */}
          </a-entity>
           {/* @ts-expect-error - Error */}
          <a-entity gaussian_splatting="src: https://huggingface.co/xValentim/splat-masp/resolve/main/venus.splat;" rotation="0 0 0" position="0 1.5 -2"></a-entity>
           {/* @ts-expect-error - Error */}
          <a-sky color="#000"></a-sky>
           {/* @ts-expect-error - Error */}
        </a-scene>
      </body>
    </html>
  )
}