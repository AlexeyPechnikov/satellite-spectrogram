#!/bin/sh

convert \
    ASI\ PRISMA\ Panchromatic\ 5m.jpg \
    ASI\ PRISMA\ VNIR\ and\ SWIR\ Bands.jpg \
    ASI\ PRISMA\ Spectrogram\ VNIR\ and\ SWIR\ Bands.jpg \
    -gravity center -append \
    ASI_PRISMA.jpg
