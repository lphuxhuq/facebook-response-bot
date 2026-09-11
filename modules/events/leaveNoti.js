const _0x431aee = _0x3792;

function _0x3792(_0x2da194, _0x3031ec) {
    const _0x382e93 = _0x382e();
    return _0x3792 = function (_0x37920b, _0x4a1445) {
        _0x37920b = _0x37920b - 0xdf;
        let _0x404665 = _0x382e93[_0x37920b];
        return _0x404665;
    }, _0x3792(_0x2da194, _0x3031ec);
}

function _0x382e() {
    const _0xea349f = ['.gìf', 'leaveGif', 'floor', '78064RBKQGj', '85tUCdFH', 'customLeave', 'onLoad', '𝙩ự 𝙧ờ𝙞', 'nodemodule', '36ZwKWwf', '𝙗ị 𝙦𝙪ả𝙣 𝙩𝙧ị 𝙫𝙞ê𝙣 đá', '245udigqB', 'config', 'sendMessage', 'HĐGN', '130hnCFLX', 'leftParticipantFbId', '109299XNBCrO', 'author', 'randomgif', '1.0.0', '💞𝘾𝙤𝙣 𝙫𝙤̛̣  {name} 𝙫𝙞̀ 𝙠𝙝𝙤̂𝙣𝙜 𝙩𝙖́𝙣 đ𝙤̂̉ 𝙚𝙢 𝙣𝙖̀𝙤 𝙣𝙚̂𝙣 đ𝙖̃ {type} 𝙠𝙝𝙤̉𝙞 𝙣𝙝𝙤́𝙢🐳, 𝙑𝙞̃𝙣𝙝 𝙗𝙞𝙚̣̂𝙩 𝙚𝙢 𝙣𝙝𝙚́ ❤', 'getCurrentUserID', 'undefined', 'data', '41960JIOJoP', '36ZcDwMy', 'threadData', 'logMessageData', 'log:unsubscribe', 'path', 'getNameUser', 'cache', 'exports', 'replace', 'run', '9111mqPxia', 'random', '248652jAXEzJ', '2846040HCHaek', '2551571QKMSbP', 'length'];
    _0x382e = function () {
        return _0xea349f;
    };
    return _0x382e();
}(function (_0x3be74e, _0xd31c0a) {
    const _0x264294 = _0x3792,
        _0x1300e4 = _0x3be74e();
    while (!![]) {
        try {
            const _0x3725c7 = parseInt(_0x264294(0xfc)) / 0x1 + parseInt(_0x264294(0xe1)) / 0x2 * (parseInt(_0x264294(0xe9)) / 0x3) + parseInt(_0x264294(0x105)) / 0x4 * (parseInt(_0x264294(0x106)) / 0x5) + -parseInt(_0x264294(0xff)) / 0x6 + -parseInt(_0x264294(0xe3)) / 0x7 * (-parseInt(_0x264294(0xf1)) / 0x8) + -parseInt(_0x264294(0xfe)) / 0x9 * (-parseInt(_0x264294(0xe7)) / 0xa) + parseInt(_0x264294(0x100)) / 0xb * (-parseInt(_0x264294(0xf2)) / 0xc);
            if (_0x3725c7 === _0xd31c0a) break;
            else _0x1300e4['push'](_0x1300e4['shift']());
        } catch (_0x530f82) {
            _0x1300e4['push'](_0x1300e4['shift']());
        }
    }
}(_0x382e, 0x5a229), module[_0x431aee(0xf9)][_0x431aee(0xe4)] = {
    'name': 'leaveNoti',
    'eventType': [_0x431aee(0xf5)],
    'version': _0x431aee(0xec),
    'credits': _0x431aee(0xe6),
    'description': 'Thông báo bot hoặc người rời khỏi nhóm có random gif/ảnh/video',
    'dependencies': {
        'fs-extra': '',
        'path': ''
    }
}, module[_0x431aee(0xf9)][_0x431aee(0x108)] = function () {
    const _0x18d320 = _0x431aee,
        {
            existsSync: _0x517daa,
            mkdirSync: _0x2b6a65
        } = global[_0x18d320(0xe0)]['fs-extra'],
        {
            join: _0x576197
        } = global[_0x18d320(0xe0)][_0x18d320(0xf6)],
        _0x50b4d1 = _0x576197(__dirname, 'cache', 'leaveGif');
    if (_0x517daa(_0x50b4d1)) _0x2b6a65(_0x50b4d1, {
        'recursive': !![]
    });
    const _0x4e37e3 = _0x576197(__dirname, 'cache', _0x18d320(0x103), _0x18d320(0xeb));
    if (!_0x517daa(_0x4e37e3)) _0x2b6a65(_0x4e37e3, {
        'recursive': !![]
    });
    return;
}, module[_0x431aee(0xf9)][_0x431aee(0xfb)] = async function ({
    api: _0xa67107,
    event: _0x544a23,
    Users: _0x254a32,
    Threads: _0x44ef71
}) {
    const _0x47c9bd = _0x431aee;
    if (_0x544a23['logMessageData'][_0x47c9bd(0xe8)] == _0xa67107[_0x47c9bd(0xee)]()) return;
    const {
        createReadStream: _0x31052f,
        existsSync: _0x17b12d,
        mkdirSync: _0x477e58,
        readdirSync: _0x30396c
    } = global[_0x47c9bd(0xe0)]['fs-extra'], {
        join: _0x4b5946
    } = global[_0x47c9bd(0xe0)][_0x47c9bd(0xf6)], {
        threadID: _0x9d5bfa
    } = _0x544a23, _0x3ffa9b = global[_0x47c9bd(0xf0)][_0x47c9bd(0xf3)]['get'](parseInt(_0x9d5bfa)) || (await _0x44ef71['getData'](_0x9d5bfa))[_0x47c9bd(0xf0)], _0x3d15b8 = global[_0x47c9bd(0xf0)]['userName']['get'](_0x544a23['logMessageData'][_0x47c9bd(0xe8)]) || await _0x254a32[_0x47c9bd(0xf7)](_0x544a23[_0x47c9bd(0xf4)][_0x47c9bd(0xe8)]), _0x105865 = _0x544a23[_0x47c9bd(0xea)] == _0x544a23['logMessageData'][_0x47c9bd(0xe8)] ? _0x47c9bd(0xdf) : _0x47c9bd(0xe2), _0x1ec3fd = _0x4b5946(__dirname, _0x47c9bd(0xf8), 'leaveGif'), _0x1e8d3b = _0x4b5946(_0x1ec3fd, _0x9d5bfa + _0x47c9bd(0x102));
    var _0x500fba, _0xa206b9;
    if (_0x17b12d(_0x1ec3fd)) _0x477e58(_0x1ec3fd, {
        'recursive': !![]
    });
    typeof _0x3ffa9b[_0x47c9bd(0x107)] == _0x47c9bd(0xef) ? _0x500fba = _0x47c9bd(0xed) : _0x500fba = _0x3ffa9b[_0x47c9bd(0x107)], _0x500fba = _0x500fba['replace'](/\{name}/g, _0x3d15b8)[_0x47c9bd(0xfa)](/\{type}/g, _0x105865);
    const _0x1dc94b = _0x30396c(_0x4b5946(__dirname, _0x47c9bd(0xf8), _0x47c9bd(0x103), 'randomgif'));
    if (_0x17b12d(_0x1e8d3b)) _0xa206b9 = {
        'body': _0x500fba,
        'attachment': _0x31052f(_0x1e8d3b)
    };
    else {
        if (_0x1dc94b[_0x47c9bd(0x101)] != 0x0) {
            const _0x3b053a = _0x4b5946(__dirname, 'cache', _0x47c9bd(0x103), _0x47c9bd(0xeb), '' + _0x1dc94b[Math[_0x47c9bd(0x104)](Math[_0x47c9bd(0xfd)]() * _0x1dc94b[_0x47c9bd(0x101)])]);
            _0xa206b9 = {
                'body': _0x500fba,
                'attachment': _0x31052f(_0x3b053a)
            };
        } else _0xa206b9 = {
            'body': _0x500fba
        };
    }
    return _0xa67107[_0x47c9bd(0xe5)](_0xa206b9, _0x9d5bfa);
});