const obfuscatedKey = '23F329160C9FA4DCDDA4C6B10CE60982D30A77D74B3BF7DEED8CD01E3CEC6BD9AF5F38B57D9A9541F71FE0E16677252215AB759962AFF1866E2FCEB5220A1DF'

const MEMORY_BASE = 0x40000000
const CODE_SECTION = 0x00400000
const DATA_SECTION = 0x10000000
const STACK_BASE = 0x7FFFFFFFFFFF

function sub_140001000(x, y) {
    return (x * 0x5DEECE66D + 0xB) & ((1 << 48) - 1);
}

function sub_140001100(a, b, c) {
    return (a ^ b) + ((c << 4) & 0xF0);
}

function sub_140001200(ptr) {
    return (ptr ^ 0xDEADBEEF) + MEMORY_BASE;
}

function asm_xor(a, b) {
    return a ^ b;
}

function asm_rol(value, count) {
    return (value << count) | (value >>> (32 - count));
}

function asm_ror(value, count) {
    return (value >>> count) | (value << (32 - count));
}

function asm_bswap(value) {
    return ((value & 0xFF) << 24) |
           ((value & 0xFF00) << 8) |
           ((value >> 8) & 0xFF00) |
           ((value >> 24) & 0xFF);
}

// Constantes para BLAKE2b
const BLAKE2B_IV32 = new Uint32Array([
    0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372,
    0x5f1d36f1, 0xa54ff53a, 0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c,
    0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
])

const SIGMA8 = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
    11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
    7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
    9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
    2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
    12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
    13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
    6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
    10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3
]

const SIGMA82 = new Uint8Array(SIGMA8.map(x => x * 2))

// Funções auxiliares para BLAKE2b
function ADD64AA(v, a, b) {
    const o0 = v[a] + v[b]
    let o1 = v[a + 1] + v[b + 1]
    if (o0 >= 0x100000000) {
        o1++
    }
    v[a] = o0
    v[a + 1] = o1
}

function ADD64AC(v, a, b0, b1) {
    let o0 = v[a] + b0
    if (b0 < 0) {
        o0 += 0x100000000
    }
    let o1 = v[a + 1] + b1
    if (o0 >= 0x100000000) {
        o1++
    }
    v[a] = o0
    v[a + 1] = o1
}

function B2B_GET32(arr, i) {
    return arr[i] ^ (arr[i + 1] << 8) ^ (arr[i + 2] << 16) ^ (arr[i + 3] << 24)
}

function B2B_G(v, m, a, b, c, d, ix, iy) {
    const x0 = m[ix]
    const x1 = m[ix + 1]
    const y0 = m[iy]
    const y1 = m[iy + 1]

    ADD64AA(v, a, b)
    ADD64AC(v, a, x0, x1)

    let xor0 = v[d] ^ v[a]
    let xor1 = v[d + 1] ^ v[a + 1]
    v[d] = xor1
    v[d + 1] = xor0

    ADD64AA(v, c, d)

    xor0 = v[b] ^ v[c]
    xor1 = v[b + 1] ^ v[c + 1]
    v[b] = (xor0 >>> 24) ^ (xor1 << 8)
    v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8)

    ADD64AA(v, a, b)
    ADD64AC(v, a, y0, y1)

    xor0 = v[d] ^ v[a]
    xor1 = v[d + 1] ^ v[a + 1]
    v[d] = (xor0 >>> 16) ^ (xor1 << 16)
    v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16)

    ADD64AA(v, c, d)

    xor0 = v[b] ^ v[c]
    xor1 = v[b + 1] ^ v[c + 1]
    v[b] = (xor1 >>> 31) ^ (xor0 << 1)
    v[b + 1] = (xor0 >>> 31) ^ (xor1 << 1)
}

function assemblyCall(address, param1, param2) {
    const result = new Uint32Array(4)
    result[0] = asm_xor(address, param1)
    result[1] = asm_rol(address, 16) | (param1 & 0xFFFF)
    result[2] = asm_xor(param2, asm_ror(address, 8))
    result[3] = asm_rol(param2, 8) | (address & 0xFF)
    return result
}

class EllipticCurve {
    constructor(a, b, p) {
        this.a = a
        this.b = b
        this.p = p
    }

    addPoint(P, Q) {
        if (P === null) return Q
        if (Q === null) return P

        const [x1, y1] = P
        const [x2, y2] = Q

        if (x1 === x2 && y1 === y2) {
            return this.doublePoint(P)
        }

        const s = ((y2 - y1) * this.modInverse(x2 - x1, this.p)) % this.p
        const x3 = (s * s - x1 - x2) % this.p
        const y3 = (s * (x1 - x3) - y1) % this.p

        return [(x3 + this.p) % this.p, (y3 + this.p) % this.p]
    }

    doublePoint(P) {
        const [x, y] = P
        const s = ((3 * x * x + this.a) * this.modInverse(2 * y, this.p)) % this.p
        const x3 = (s * s - 2 * x) % this.p
        const y3 = (s * (x - x3) - y) % this.p

        return [(x3 + this.p) % this.p, (y3 + this.p) % this.p]
    }

    scalarMult(k, P) {
        let Q = null
        let R = P

        while (k > 0) {
            if (k & 1) {
                Q = this.addPoint(Q, R)
            }
            R = this.doublePoint(R)
            k >>= 1
        }

        return Q
    }

    modInverse(a, m) {
        let [old_r, r] = [a, m]
        let [old_s, s] = [1, 0]

        while (r !== 0) {
            const quotient = Math.floor(old_r / r)
            ;[old_r, r] = [r, old_r - quotient * r]
            ;[old_s, s] = [s, old_s - quotient * s]
        }

        return (old_s + m) % m
    }
}

function deobfuscateKey(obfuscatedKey) {
    const keyBytes = Buffer.from(obfuscatedKey, 'hex')
    const deobfuscatedBytes = new Uint8Array(32)

    for (let i = 0; i < 32; i++) {
        const assemblyResult = assemblyCall(CODE_SECTION + i * 4, keyBytes[i], i)
        deobfuscatedBytes[i] = assemblyResult[0] & 0xFF
    }

    // Aplicar operações elípticas
    const curve = new EllipticCurve(2, 3, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F)
    const basePoint = [0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
                       0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8]
    
    let point = basePoint
    for (let i = 0; i < 32; i += 8) {
        const scalar = B2B_GET32(deobfuscatedBytes, i)
        point = curve.scalarMult(scalar, point)
    }

    const ctx = { h: new Uint32Array(16), b: new Uint8Array(128), c: 0, t: 0 }
    for (let i = 0; i < 16; i++) {
        ctx.h[i] = BLAKE2B_IV32[i] ^ B2B_GET32(deobfuscatedBytes, i * 4)
    }

    const v = new Uint32Array(32)
    const m = new Uint32Array(32)

    for (let i = 0; i < 12; i++) {
        v.set(ctx.h)
        v.set(BLAKE2B_IV32, 16)
        v[24] = v[24] ^ ctx.t
        v[25] = v[25] ^ (ctx.t / 0x100000000)
        v[28] = v[28] ^ 0xFFFFFFFF

        for (let j = 0; j < 32; j++) {
            m[j] = B2B_GET32(ctx.b, j * 4)
        }

        for (let j = 0; j < 12; j++) {
            B2B_G(v, m, 0, 8, 16, 24, SIGMA82[j * 16 + 0], SIGMA82[j * 16 + 1])
            B2B_G(v, m, 2, 10, 18, 26, SIGMA82[j * 16 + 2], SIGMA82[j * 16 + 3])
            B2B_G(v, m, 4, 12, 20, 28, SIGMA82[j * 16 + 4], SIGMA82[j * 16 + 5])
            B2B_G(v, m, 6, 14, 22, 30, SIGMA82[j * 16 + 6], SIGMA82[j * 16 + 7])
            B2B_G(v, m, 0, 10, 20, 30, SIGMA82[j * 16 + 8], SIGMA82[j * 16 + 9])
            B2B_G(v, m, 2, 12, 22, 24, SIGMA82[j * 16 + 10], SIGMA82[j * 16 + 11])
            B2B_G(v, m, 4, 14, 16, 26, SIGMA82[j * 16 + 12], SIGMA82[j * 16 + 13])
            B2B_G(v, m, 6, 8, 18, 28, SIGMA82[j * 16 + 14], SIGMA82[j * 16 + 15])
        }

        for (let j = 0; j < 16; j++) {
            ctx.h[j] = ctx.h[j] ^ v[j] ^ v[j + 16]
        }
    }

    const hash = new Uint8Array(64)
    for (let i = 0; i < 64; i++) {
        hash[i] = ctx.h[i >> 2] >> (8 * (i & 3))
    }

    return Buffer.from(hash).toString('hex')
}

const deobfuscatedKey = deobfuscateKey(obfuscatedKey)
console.log('Deobfuscated Key:', deobfuscatedKey)

function sub_140002000(data) {
    const result = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
        result[i] = asm_rol(data[i], i % 8)
    }
    return result
}

function sub_140003000(data, key) {
    const result = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ key[i % key.length]
    }
    return result
}

function sub_140004000(data) {
    const result = new Uint32Array(data.length / 4)
    for (let i = 0; i < result.length; i++) {
        result[i] = asm_bswap(B2B_GET32(data, i * 4))
    }
    return result
}

const additionalData = sub_140002000(deobfuscatedBytes)
const xoredData = sub_140003000(additionalData, obfuscatedKey)
const swappedData = sub_140004000(xoredData)

console.log('Additional processed data:', Buffer.from(swappedData.buffer).toString('hex'))