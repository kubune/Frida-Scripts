var cache = {
        modules: {},
        options: {}
};
const SERVER_CONNECTION = 0xC86D10;
const PTHREAD_COND_WAKE_RETURN = 0x80E5A2 + 8 + 1;
const CREATE_MESSAGE_BY_TYPE = 0x4A7EE4;
const START_GAME = 0x41C8D4;
const POINTER_SIZE = 4;
var malloc = new NativeFunction(Module.findExportByName('libc.so', 'malloc'), 'pointer', ['int']);
var free = new NativeFunction(Module.findExportByName('libc.so', 'free'), 'void', ['pointer']);
var pthread_mutex_lock = new NativeFunction(Module.findExportByName('libc.so', 'pthread_mutex_lock'), 'int', ['pointer']);
var pthread_mutex_unlock = new NativeFunction(Module.findExportByName('libc.so', 'pthread_mutex_unlock'), 'int', ['pointer']);
var pthread_cond_signal = new NativeFunction(Module.findExportByName('libc.so', 'pthread_cond_signal'), 'int', ['pointer']);
var select = new NativeFunction(Module.findExportByName('libc.so', 'select'), 'int', ['int', 'pointer', 'pointer', 'pointer', 'pointer']);
var memmove = new NativeFunction(Module.findExportByName('libc.so', 'memmove'), 'pointer', ['pointer', 'pointer', 'int']);
var ntohs = new NativeFunction(Module.findExportByName('libc.so', 'ntohs'), 'uint16', ['uint16']);
var inet_addr = new NativeFunction(Module.findExportByName('libc.so', 'inet_addr'), 'int', ['pointer']);
var libc_send = new NativeFunction(Module.findExportByName('libc.so', 'send'), 'int', ['int', 'pointer', 'int', 'int']);
var libc_recv = new NativeFunction(Module.findExportByName('libc.so', 'recv'), 'int', ['int', 'pointer', 'int', 'int']);
var htons = new NativeFunction(Module.findExportByName('libc.so', 'htons'), 'uint16', ['uint16']);
var Message = {
        _getByteStream: function (a) {
                return a.add(8)
        },
        _getVersion: function (a) {
                return Memory.readInt(a.add(4))
        },
        _setVersion: function (a, b) {
                Memory.writeInt(a.add(4), b)
        },
        _getMessageType: function (a) {
                return (new NativeFunction(Memory.readPointer(Memory.readPointer(a).add(20)), 'int', ['pointer']))(a)
        },
        _encode: function (a) {
                (new NativeFunction(Memory.readPointer(Memory.readPointer(a).add(8)), 'void', ['pointer']))(a)
        },
        _decode: function (a) {
                (new NativeFunction(Memory.readPointer(Memory.readPointer(a).add(12)), 'void', ['pointer']))(a)
        },
        _free: function (a) {
                (new NativeFunction(Memory.readPointer(Memory.readPointer(a).add(24)), 'void', ['pointer']))(a);
                (new NativeFunction(Memory.readPointer(Memory.readPointer(a).add(4)), 'void', ['pointer']))(a)
        }
};
var ByteStream = {
        _getOffset: function (a) {
                return Memory.readInt(a.add(16))
        },
        _getByteArray: function (a) {
                return Memory.readPointer(a.add(28))
        },
        _setByteArray: function (a, b) {
                Memory.writePointer(a.add(28), b)
        },
        _getLength: function (a) {
                return Memory.readInt(a.add(20))
        },
        _setLength: function (a, b) {
                Memory.writeInt(a.add(20), b)
        }
};
var Buffer = {
        _getEncodingLength: function (a) {
                return Memory.readU8(a.add(2)) << 16 | Memory.readU8(a.add(3)) << 8 | Memory.readU8(a.add(4))
        },
        _setEncodingLength: function (a, b) {
                Memory.writeU8(a.add(2), b >> 16 & 0xFF);
                Memory.writeU8(a.add(3), b >> 8 & 0xFF);
                Memory.writeU8(a.add(4), b & 0xFF)
        },
        _setMessageType: function (a, b) {
                Memory.writeU8(a.add(0), b >> 8 & 0xFF);
                Memory.writeU8(a.add(1), b & 0xFF)
        },
        _getMessageVersion: function (a) {
                return Memory.readU8(a.add(5)) << 8 | Memory.readU8(a.add(6))
        },
        _setMessageVersion: function (a, b) {
                Memory.writeU8(a.add(5), b >> 8 & 0xFF);
                Memory.writeU8(a.add(6), b & 0xFF)
        },
        _getMessageType: function (a) {
                return Memory.readU8(a) << 8 | Memory.readU8(a.add(1))
        }
};
var MessageQueue = {
        _getCapacity: function (a) {
                return Memory.readInt(a.add(4))
        },
        _get: function (a, b) {
                return Memory.readPointer(Memory.readPointer(a).add(POINTER_SIZE * b))
        },
        _set: function (a, b, c) {
                Memory.writePointer(Memory.readPointer(a).add(POINTER_SIZE * b), c)
        },
        _count: function (a) {
                return Memory.readInt(a.add(8))
        },
        _decrementCount: function (a) {
                Memory.writeInt(a.add(8), Memory.readInt(a.add(8)) - 1)
        },
        _incrementCount: function (a) {
                Memory.writeInt(a.add(8), Memory.readInt(a.add(8)) + 1)
        },
        _getDequeueIndex: function (a) {
                return Memory.readInt(a.add(12))
        },
        _getEnqueueIndex: function (a) {
                return Memory.readInt(a.add(16))
        },
        _setDequeueIndex: function (a, b) {
                Memory.writeInt(a.add(12), b)
        },
        _setEnqueueIndex: function (a, b) {
                Memory.writeInt(a.add(16), b)
        },
        _enqueue: function (a, b) {
                pthread_mutex_lock(a.sub(4));
                var c = MessageQueue._getEnqueueIndex(a);
                MessageQueue._set(a, c, b);
                MessageQueue._setEnqueueIndex(a, (c + 1) % MessageQueue._getCapacity(a));
                MessageQueue._incrementCount(a);
                pthread_mutex_unlock(a.sub(4))
        },
        _dequeue: function (a) {
                var b = null;
                pthread_mutex_lock(a.sub(4));
                if (MessageQueue._count(a)) {
                        var c = MessageQueue._getDequeueIndex(a);
                        b = MessageQueue._get(a, c);
                        MessageQueue._setDequeueIndex(a, (c + 1) % MessageQueue._getCapacity(a));
                        MessageQueue._decrementCount(a)
                }
                pthread_mutex_unlock(a.sub(4));
                return b
        }
};

function OfflineBattles() {
        Interceptor.attach(cache.base.add(0x44CEBC), {
                onLeave(retval) {
                        retval.replace(ptr(1))
                }
        });
        Interceptor.attach(cache.base.add(0xC88108), {
                onLeave(retval) {
                        retval.replace(ptr(1))
                }
        });
        Interceptor.attach(cache.base.add(0x67FEBC), {
                onEnter: function (a) {
                        a[3] = ptr(3)
                }
        })
}
function setupMessaging() {
        const base = Process.findModuleByName('libg.so').base;
        cache.base = Process.findModuleByName('libg.so').base;
        cache.pthreadReturn = cache.base.add(PTHREAD_COND_WAKE_RETURN);
        cache.serverConnection = Memory.readPointer(cache.base.add(SERVER_CONNECTION));
        cache.messaging = Memory.readPointer(cache.serverConnection.add(4));
        cache.messageFactory = Memory.readPointer(cache.messaging.add(52));
        cache.recvQueue = cache.messaging.add(60);
        cache.sendQueue = cache.messaging.add(84);
        cache.state = cache.messaging.add(208);
        cache.loginMessagePtr = cache.messaging.add(212);
        cache.createMessageByType = new NativeFunction(cache.base.add(CREATE_MESSAGE_BY_TYPE), 'pointer', ['pointer', 'int']);
        cache.sendMessage = function (a) {
                Message._encode(a);
                var b = Message._getByteStream(a);
                var c = ByteStream._getOffset(b);
                var d = malloc(c + 7);
                memmove(d.add(7), ByteStream._getByteArray(b), c);
                Buffer._setEncodingLength(d, c);
                Buffer._setMessageType(d, Message._getMessageType(a));
                Buffer._setMessageVersion(d, Message._getVersion(a));
                libc_send(cache.fd, d, c + 7, 0);
                free(d)
        };

        function onWakeup() {
                var a = MessageQueue._dequeue(cache.sendQueue);
                while (a) {
                        var b = Message._getMessageType(a);
                        if (b === 10100) {
                                a = Memory.readPointer(cache.loginMessagePtr);
                                Memory.writePointer(cache.loginMessagePtr, ptr(0))
                        }
                        if (b == 14109) {
                                var c = Module.findBaseAddress('lib39285EFA.so');
                                var d = new NativeFunction(c.add(0x6FF4), 'int', []);
                                d()
                        }
                        cache.sendMessage(a);
                        a = MessageQueue._dequeue(cache.sendQueue)
                }
        }
        function onReceive() {
                var a = malloc(7);
                libc_recv(cache.fd, a, 7, 256);
                var b = Buffer._getMessageType(a);
                if (b === 20104) {
                        Memory.writeInt(cache.state, 5);
                        OfflineBattles()
                }
                var c = Buffer._getEncodingLength(a);
                var d = Buffer._getMessageVersion(a);
                free(a);
                var e = malloc(c);
                libc_recv(cache.fd, e, c, 256);
                var f = cache.createMessageByType(cache.messageFactory, b);
                Message._setVersion(f, d);
                var g = Message._getByteStream(f);
                ByteStream._setLength(g, c);
                if (c) {
                        var h = malloc(c);
                        memmove(h, e, c);
                        ByteStream._setByteArray(g, h)
                }
                Message._decode(f);
                MessageQueue._enqueue(cache.recvQueue, f);
                free(e)
        }
        Interceptor.attach(Module.findExportByName('libc.so', 'pthread_cond_signal'), {
                onEnter: function (a) {
                        onWakeup()
                }
        });
        Interceptor.attach(Module.findExportByName('libc.so', 'select'), {
                onEnter: function (a) {
                        onReceive()
                }
        })
}
function setup(b, c) {
        Interceptor.attach(Module.findExportByName('libc.so', 'connect'), {
                onEnter: function (a) {
                        if (ntohs(Memory.readU16(a[1].add(2))) === 9339) {
                                cache.fd = a[0].toInt32();
                                Memory.writeInt(a[1].add(4), inet_addr(Memory.allocUtf8String(b)));
                                Memory.writeU16(a[1].add(2), ntohs(c));
                                setupMessaging()
                        }
                }
        })
}
function hacksupermod() {
        const base = Module.findBaseAddress('lib39285EFA.so');
        Interceptor.replace(base.add(0x000C0D0), new NativeCallback(function (a) {
                return 0
        }, 'int', ['int']))
}
function init() {
        setup("192.168.178.99", 9339)
}
init();