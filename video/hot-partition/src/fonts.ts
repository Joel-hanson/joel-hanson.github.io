import {continueRender, delayRender, staticFile} from 'remotion';
import {useEffect, useState} from 'react';

export const useSiteFonts = () => {
  const [handle] = useState(() => delayRender('Loading site fonts'));

  useEffect(() => {
    const faces = [
      new FontFace('Geist', `url(${staticFile('fonts/Geist-Variable.woff2')})`, {
        weight: '100 900',
        style: 'normal',
      }),
      new FontFace('GeistMono', `url(${staticFile('fonts/GeistMono-Variable.woff2')})`, {
        weight: '100 900',
        style: 'normal',
      }),
    ];

    Promise.all(
      faces.map((face) =>
        face.load().then((loaded) => {
          document.fonts.add(loaded);
        }),
      ),
    )
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};
