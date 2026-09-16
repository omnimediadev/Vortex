/**
 * Ultra-Fast Pure JavaScript GIF Encoder & Color Quantizer (NeuQuant + LZW)
 * Fully standalone, zero dependencies, works 100% in all modern desktop and mobile browsers.
 */

class NeuQuant {
  constructor(pixels, samplefac = 10) {
    this.network = [];
    this.netindex = new Int32Array(256);
    this.bias = new Int32Array(256);
    this.freq = new Int32Array(256);
    this.radpower = new Int32Array(32);

    this.netsize = 256;
    this.prime1 = 499;
    this.prime2 = 491;
    this.prime3 = 487;
    this.prime4 = 503;
    this.minpicturebytes = 3 * this.prime4;

    this.maxnetpos = this.netsize - 1;
    this.netbiasshift = 4;
    this.ncycles = 100;

    this.intbiasshift = 16;
    this.intbias = 1 << this.intbiasshift;
    this.gammashift = 10;
    this.betashift = 10;
    this.beta = this.intbias >> this.betashift;
    this.betagamma = this.intbias << (this.gammashift - this.betashift);

    this.initrad = this.netsize >> 3;
    this.radiusbiasshift = 6;
    this.radiusbias = 1 << this.radiusbiasshift;
    this.initradius = this.initrad * this.radiusbias;
    this.radiusdec = 30;

    this.alphabiasshift = 10;
    this.initalpha = 1 << this.alphabiasshift;

    this.radbiasshift = 8;
    this.radbias = 1 << this.radbiasshift;
    this.alpharadbshift = this.alphabiasshift + this.radbiasshift;
    this.alpharadbias = 1 << this.alpharadbshift;

    this.thepicture = pixels;
    this.lengthcount = pixels.length;
    this.samplefac = Math.max(1, samplefac);

    for (let i = 0; i < this.netsize; i++) {
      const p = (i << (this.netbiasshift + 8)) / this.netsize;
      this.network[i] = new Float64Array([p, p, p, 0]);
      this.freq[i] = this.intbias / this.netsize;
      this.bias[i] = 0;
    }
  }

  buildPalette() {
    this.learn();
    this.unbiasnet();
    this.inxbuild();
    const palette = [];
    for (let i = 0; i < this.netsize; i++) {
      palette.push(
        Math.round(this.network[i][0]),
        Math.round(this.network[i][1]),
        Math.round(this.network[i][2])
      );
    }
    return palette;
  }

  lookup(b, g, r) {
    let bestd = 1000;
    let best = -1;
    let a = this.netindex[g];
    let p = a;

    while (p < this.netsize || a >= 0) {
      if (p < this.netsize) {
        const e = this.network[p];
        let dist = e[1] - g;
        if (dist >= bestd) p = this.netsize;
        else {
          p++;
          if (dist < 0) dist = -dist;
          let a2 = e[0] - b;
          if (a2 < 0) a2 = -a2;
          dist += a2;
          if (dist < bestd) {
            a2 = e[2] - r;
            if (a2 < 0) a2 = -a2;
            dist += a2;
            if (dist < bestd) {
              bestd = dist;
              best = e[3];
            }
          }
        }
      }
      if (a >= 0) {
        const e = this.network[a];
        let dist = g - e[1];
        if (dist >= bestd) a = -1;
        else {
          a--;
          if (dist < 0) dist = -dist;
          let a2 = e[0] - b;
          if (a2 < 0) a2 = -a2;
          dist += a2;
          if (dist < bestd) {
            a2 = e[2] - r;
            if (a2 < 0) a2 = -a2;
            dist += a2;
            if (dist < bestd) {
              bestd = dist;
              best = e[3];
            }
          }
        }
      }
    }
    return best;
  }

  alterneigh(rad, i, b, g, r) {
    let lo = Math.max(0, i - rad);
    let hi = Math.min(this.netsize, i + rad);
    let j = i + 1;
    let k = i - 1;
    let m = 1;

    while (j < hi || k >= lo) {
      const a = this.radpower[m++];
      if (j < hi) {
        const p = this.network[j++];
        p[0] -= (a * (p[0] - b)) / this.alpharadbias;
        p[1] -= (a * (p[1] - g)) / this.alpharadbias;
        p[2] -= (a * (p[2] - r)) / this.alpharadbias;
      }
      if (k >= lo) {
        const p = this.network[k--];
        p[0] -= (a * (p[0] - b)) / this.alpharadbias;
        p[1] -= (a * (p[1] - g)) / this.alpharadbias;
        p[2] -= (a * (p[2] - r)) / this.alpharadbias;
      }
    }
  }

  altersingle(alpha, i, b, g, r) {
    const n = this.network[i];
    n[0] -= (alpha * (n[0] - b)) / this.initalpha;
    n[1] -= (alpha * (n[1] - g)) / this.initalpha;
    n[2] -= (alpha * (n[2] - r)) / this.initalpha;
  }

  contest(b, g, r) {
    let bestd = ~(1 << 31);
    let bestbiasd = bestd;
    let bestpos = -1;
    let bestbiaspos = bestpos;

    for (let i = 0; i < this.netsize; i++) {
      const n = this.network[i];
      let dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
      if (dist < bestd) {
        bestd = dist;
        bestpos = i;
      }
      let biasdist = dist - (this.bias[i] >> (this.intbiasshift - this.netbiasshift));
      if (biasdist < bestbiasd) {
        bestbiasd = biasdist;
        bestbiaspos = i;
      }
      let betafreq = this.freq[i] >> this.betashift;
      this.freq[i] -= betafreq;
      this.bias[i] += betafreq << this.gammashift;
    }
    this.freq[bestpos] += this.beta;
    this.bias[bestpos] -= this.betagamma;
    return bestbiaspos;
  }

  inxbuild() {
    let previouscol = 0;
    let startpos = 0;
    for (let i = 0; i < this.netsize; i++) {
      const p = this.network[i];
      let smallpos = i;
      let smallval = p[1];
      for (let j = i + 1; j < this.netsize; j++) {
        const q = this.network[j];
        if (q[1] < smallval) {
          smallpos = j;
          smallval = q[1];
        }
      }
      const q = this.network[smallpos];
      if (i !== smallpos) {
        let x = p[0]; p[0] = q[0]; q[0] = x;
        x = p[1]; p[1] = q[1]; q[1] = x;
        x = p[2]; p[2] = q[2]; q[2] = x;
        x = p[3]; p[3] = q[3]; q[3] = x;
      }
      if (smallval !== previouscol) {
        this.netindex[previouscol] = (startpos + i) >> 1;
        for (let j = previouscol + 1; j < smallval; j++) this.netindex[j] = i;
        previouscol = smallval;
        startpos = i;
      }
    }
    this.netindex[previouscol] = (startpos + this.maxnetpos) >> 1;
    for (let j = previouscol + 1; j < 256; j++) this.netindex[j] = this.maxnetpos;
  }

  learn() {
    let lengthcount = this.lengthcount;
    let alphadec = 30 + (this.samplefac - 1) / 3;
    let samplepixels = lengthcount / (4 * this.samplefac);
    let delta = Math.floor(samplepixels / this.ncycles);
    let alpha = this.initalpha;
    let radius = this.initradius;

    let rad = radius >> this.radiusbiasshift;
    if (rad <= 1) rad = 0;
    for (let i = 0; i < rad; i++) {
      this.radpower[i] = Math.floor(alpha * (((rad * rad - i * i) * this.radbias) / (rad * rad)));
    }

    let step;
    if (lengthcount < this.minpicturebytes) {
      this.samplefac = 1;
      step = 4;
    } else if (lengthcount % this.prime1 !== 0) step = 4 * this.prime1;
    else if (lengthcount % this.prime2 !== 0) step = 4 * this.prime2;
    else if (lengthcount % this.prime3 !== 0) step = 4 * this.prime3;
    else step = 4 * this.prime4;

    let pix = 0;
    let i = 0;
    while (i < samplepixels) {
      const b = this.thepicture[pix] & 0xff;
      const g = this.thepicture[pix + 1] & 0xff;
      const r = this.thepicture[pix + 2] & 0xff;
      let j = this.contest(b, g, r);

      this.altersingle(alpha, j, b, g, r);
      if (rad !== 0) this.alterneigh(rad, j, b, g, r);

      pix += step;
      if (pix >= lengthcount) pix -= lengthcount;

      i++;
      if (delta === 0) delta = 1;
      if (i % delta === 0) {
        alpha -= alpha / alphadec;
        radius -= radius / this.radiusdec;
        rad = radius >> this.radiusbiasshift;
        if (rad <= 1) rad = 0;
        for (let k = 0; k < rad; k++) {
          this.radpower[k] = Math.floor(alpha * (((rad * rad - k * k) * this.radbias) / (rad * rad)));
        }
      }
    }
  }

  unbiasnet() {
    for (let i = 0; i < this.netsize; i++) {
      this.network[i][0] >>= this.netbiasshift;
      this.network[i][1] >>= this.netbiasshift;
      this.network[i][2] >>= this.netbiasshift;
      this.network[i][3] = i;
    }
  }
}

class LZWEncoder {
  constructor(width, height, pixels, colorDepth) {
    this.width = width;
    this.height = height;
    this.pixels = pixels;
    this.initCodeSize = Math.max(2, colorDepth);
    this.accum = new Uint8Array(256);
    this.htab = new Int32Array(5003);
    this.codetab = new Int32Array(5003);
    this.cur_accum = 0;
    this.cur_bits = 0;
    this.a_count = 0;
  }

  char_out(c, outs) {
    this.accum[this.a_count++] = c;
    if (this.a_count >= 254) this.flush_char(outs);
  }

  cl_block(outs) {
    this.cl_hash(5003);
    this.free_ent = this.ClearCode + 2;
    this.clear_flg = true;
    this.output(this.ClearCode, outs);
  }

  cl_hash(hsize) {
    for (let i = 0; i < hsize; ++i) this.htab[i] = -1;
  }

  compress(init_bits, outs) {
    this.g_init_bits = init_bits;
    this.clear_flg = false;
    this.n_bits = this.g_init_bits;
    this.maxcode = (1 << this.n_bits) - 1;

    this.ClearCode = 1 << (init_bits - 1);
    this.EOFCode = this.ClearCode + 1;
    this.free_ent = this.ClearCode + 2;

    this.a_count = 0;
    let ent = this.nextPixel();
    let hshift = 0;
    for (let fcode = 5003; fcode < 65536; fcode *= 2) ++hshift;
    hshift = 8 - hshift;
    const hsize_reg = 5003;
    this.cl_hash(hsize_reg);

    this.output(this.ClearCode, outs);

    outer_loop: while (true) {
      let c = this.nextPixel();
      if (c === null) break;

      let fcode = (c << 12) + ent;
      let i = (c << hshift) ^ ent;

      if (this.htab[i] === fcode) {
        ent = this.codetab[i];
        continue;
      } else if (this.htab[i] >= 0) {
        let disp = hsize_reg - i;
        if (i === 0) disp = 1;
        do {
          if ((i -= disp) < 0) i += hsize_reg;
          if (this.htab[i] === fcode) {
            ent = this.codetab[i];
            continue outer_loop;
          }
        } while (this.htab[i] >= 0);
      }

      this.output(ent, outs);
      ent = c;
      if (this.free_ent < 4096) {
        this.codetab[i] = this.free_ent++;
        this.htab[i] = fcode;
      } else {
        this.cl_block(outs);
      }
    }

    this.output(ent, outs);
    this.output(this.EOFCode, outs);
  }

  encode(outs) {
    outs.writeByte(this.initCodeSize);
    this.remaining = this.width * this.height;
    this.curPixel = 0;
    this.compress(this.initCodeSize + 1, outs);
    outs.writeByte(0);
  }

  flush_char(outs) {
    if (this.a_count > 0) {
      outs.writeByte(this.a_count);
      outs.writeBytes(this.accum, 0, this.a_count);
      this.a_count = 0;
    }
  }

  nextPixel() {
    if (this.remaining === 0) return null;
    --this.remaining;
    return this.pixels[this.curPixel++];
  }

  output(code, outs) {
    this.cur_accum &= (1 << this.cur_bits) - 1;
    if (this.cur_bits > 0) this.cur_accum |= code << this.cur_bits;
    else this.cur_accum = code;
    this.cur_bits += this.n_bits;

    while (this.cur_bits >= 8) {
      this.char_out(this.cur_accum & 0xff, outs);
      this.cur_accum >>= 8;
      this.cur_bits -= 8;
    }

    if (this.free_ent > this.maxcode || this.clear_flg) {
      if (this.clear_flg) {
        this.maxcode = (1 << (this.n_bits = this.g_init_bits)) - 1;
        this.clear_flg = false;
      } else {
        ++this.n_bits;
        if (this.n_bits === 12) this.maxcode = 4096;
        else this.maxcode = (1 << this.n_bits) - 1;
      }
    }

    if (code === this.EOFCode) {
      while (this.cur_bits > 0) {
        this.char_out(this.cur_accum & 0xff, outs);
        this.cur_accum >>= 8;
        this.cur_bits -= 8;
      }
      this.flush_char(outs);
    }
  }
}

class ByteArray {
  constructor() {
    this.data = [];
  }
  writeByte(val) {
    this.data.push(val & 0xff);
  }
  writeBytes(arr, offset = 0, length = arr.length) {
    for (let i = offset; i < offset + length; i++) {
      this.data.push(arr[i] & 0xff);
    }
  }
  writeUTF(str) {
    for (let i = 0; i < str.length; i++) {
      this.data.push(str.charCodeAt(i));
    }
  }
  toUint8Array() {
    return new Uint8Array(this.data);
  }
}

export class FastGIFEncoder {
  constructor(width, height) {
    this.width = Math.round(width);
    this.height = Math.round(height);
    this.delay = 10; // in 1/100ths of second (10 = 100ms = 10fps)
    this.repeat = 0; // 0 = infinite loop, -1 = no loop, >0 = count
    this.colorDepth = 8;
    this.sampleInterval = 10; // NeuQuant sampling quality (1 best, 20 fastest)
    this.dither = false;
    this.out = new ByteArray();
    this.firstFrame = true;
  }

  setDelay(ms) {
    this.delay = Math.round(ms / 10);
    if (this.delay < 2) this.delay = 2; // Browser GIF minimum tick
  }

  setFPS(fps) {
    this.setDelay(1000 / fps);
  }

  setRepeat(repeat) {
    this.repeat = repeat;
  }

  setQuality(quality) {
    // Quality 1 (highest) to 20 (fastest)
    this.sampleInterval = Math.max(1, Math.min(20, quality));
  }

  setDither(enabled) {
    this.dither = !!enabled;
  }

  start() {
    this.out = new ByteArray();
    this.firstFrame = true;
    this.writeHeader();
  }

  writeHeader() {
    this.out.writeUTF("GIF89a");
  }

  writeLogicalScreenDescriptor(palette) {
    // Logical screen width and height (Little Endian)
    this.out.writeByte(this.width & 0xff);
    this.out.writeByte((this.width >> 8) & 0xff);
    this.out.writeByte(this.height & 0xff);
    this.out.writeByte((this.height >> 8) & 0xff);

    // Global Color Table Flag (1), Color Resolution (111 = 8 bits), Sort (0), Size of table (111 = 256 colors)
    this.out.writeByte(0xf7);
    this.out.writeByte(0); // Background Color Index
    this.out.writeByte(0); // Pixel Aspect Ratio

    // Write Global Palette (3 * 256 bytes)
    for (let i = 0; i < palette.length; i++) {
      this.out.writeByte(palette[i]);
    }
    // Pad to 256 entries if needed
    for (let i = palette.length; i < 256 * 3; i++) {
      this.out.writeByte(0);
    }
  }

  writeNetscapeAppExtension() {
    if (this.repeat >= 0) {
      this.out.writeByte(0x21); // Extension Introducer
      this.out.writeByte(0xff); // Application Extension Label
      this.out.writeByte(11);   // Block Size
      this.out.writeUTF("NETSCAPE2.0");
      this.out.writeByte(3);    // Sub-block size
      this.out.writeByte(1);    // Loop sub-block id
      this.out.writeByte(this.repeat & 0xff);
      this.out.writeByte((this.repeat >> 8) & 0xff);
      this.out.writeByte(0);    // Block Terminator
    }
  }

  writeGraphicControlExtension() {
    this.out.writeByte(0x21); // Extension Introducer
    this.out.writeByte(0xf9); // Graphic Control Label
    this.out.writeByte(4);    // Block Size
    this.out.writeByte(0x04); // Disposal Method: 0x04 (do not dispose / restore previous)
    this.out.writeByte(this.delay & 0xff);
    this.out.writeByte((this.delay >> 8) & 0xff);
    this.out.writeByte(0);    // Transparent color index (0)
    this.out.writeByte(0);    // Block Terminator
  }

  writeImageDescriptor(hasLocalPalette = false, palette = null) {
    this.out.writeByte(0x2c); // Image Separator
    this.out.writeByte(0);    // Left Position
    this.out.writeByte(0);
    this.out.writeByte(0);    // Top Position
    this.out.writeByte(0);
    this.out.writeByte(this.width & 0xff);
    this.out.writeByte((this.width >> 8) & 0xff);
    this.out.writeByte(this.height & 0xff);
    this.out.writeByte((this.height >> 8) & 0xff);

    if (hasLocalPalette && palette) {
      // Local Color Table Flag (1) + Not Interlaced (0) + Size of table (111 = 256 colors)
      this.out.writeByte(0x87);
      for (let i = 0; i < palette.length; i++) {
        this.out.writeByte(palette[i]);
      }
      for (let i = palette.length; i < 256 * 3; i++) {
        this.out.writeByte(0);
      }
    } else {
      this.out.writeByte(0);    // No Local Color Table (use Global)
    }
  }

  addFrame(ctx) {
    const imgData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const len = data.length;

    // Convert RGBA to BGR buffer for NeuQuant
    const bgr = new Uint8Array((len / 4) * 3);
    let idx = 0;
    for (let i = 0; i < len; i += 4) {
      bgr[idx++] = data[i + 2]; // B
      bgr[idx++] = data[i + 1]; // G
      bgr[idx++] = data[i];     // R
    }

    const nq = new NeuQuant(bgr, this.sampleInterval);
    const palette = nq.buildPalette();

    if (this.firstFrame) {
      this.writeLogicalScreenDescriptor(palette);
      this.writeNetscapeAppExtension();
      this.firstFrame = false;
      this.writeGraphicControlExtension();
      this.writeImageDescriptor(false);
    } else {
      this.writeGraphicControlExtension();
      this.writeImageDescriptor(true, palette);
    }

    // Map pixels to color indexes (with optional Floyd-Steinberg dithering)
    const numPixels = this.width * this.height;
    const indexedPixels = new Uint8Array(numPixels);

    if (this.dither) {
      const curData = new Float32Array(len);
      for (let i = 0; i < len; i++) curData[i] = data[i];

      let pIdx = 0;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const i4 = (y * this.width + x) * 4;
          const r = Math.max(0, Math.min(255, curData[i4]));
          const g = Math.max(0, Math.min(255, curData[i4 + 1]));
          const b = Math.max(0, Math.min(255, curData[i4 + 2]));

          const colorIdx = nq.lookup(b, g, r);
          indexedPixels[pIdx++] = colorIdx;

          const pr = palette[colorIdx * 3 + 2];
          const pg = palette[colorIdx * 3 + 1];
          const pb = palette[colorIdx * 3];

          const er = r - pr;
          const eg = g - pg;
          const eb = b - pb;

          if (x + 1 < this.width) {
            const nextIdx = i4 + 4;
            curData[nextIdx] += (er * 7) / 16;
            curData[nextIdx + 1] += (eg * 7) / 16;
            curData[nextIdx + 2] += (eb * 7) / 16;
          }
          if (y + 1 < this.height) {
            if (x > 0) {
              const dlIdx = ((y + 1) * this.width + (x - 1)) * 4;
              curData[dlIdx] += (er * 3) / 16;
              curData[dlIdx + 1] += (eg * 3) / 16;
              curData[dlIdx + 2] += (eb * 3) / 16;
            }
            const dIdx = ((y + 1) * this.width + x) * 4;
            curData[dIdx] += (er * 5) / 16;
            curData[dIdx + 1] += (eg * 5) / 16;
            curData[dIdx + 2] += (eb * 5) / 16;
            if (x + 1 < this.width) {
              const drIdx = ((y + 1) * this.width + (x + 1)) * 4;
              curData[drIdx] += (er * 1) / 16;
              curData[drIdx + 1] += (eg * 1) / 16;
              curData[drIdx + 2] += (eb * 1) / 16;
            }
          }
        }
      }
    } else {
      let pIdx = 0;
      for (let i = 0; i < len; i += 4) {
        indexedPixels[pIdx++] = nq.lookup(data[i + 2], data[i + 1], data[i]);
      }
    }

    const encoder = new LZWEncoder(this.width, this.height, indexedPixels, this.colorDepth);
    encoder.encode(this.out);
  }

  finish() {
    this.out.writeByte(0x3b); // GIF Trailer
    const uint8 = this.out.toUint8Array();
    return new Blob([uint8], { type: "image/gif" });
  }
}

if (typeof window !== 'undefined') {
  window.FastGIFEncoder = FastGIFEncoder;
}
