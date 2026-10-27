import { http, HttpResponse } from 'msw';

import { OnePixelWebpResponseMock } from '$mocks/data/images/response/OnePixelWebpResponseMock.ts';

export const images = [
  http.get(
    'http://localhost/images/*',
    () =>
      HttpResponse.arrayBuffer(OnePixelWebpResponseMock.buffer, {
        headers: { 'content-type': 'image/webp' },
      }),
  ),
];
