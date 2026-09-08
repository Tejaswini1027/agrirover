// Verifies the crop-aware framing rules without a camera.
// Mirrors src/lib/faceModels.js judgeFraming exactly.
const MIN_FACE_AREA_RATIO = 0.04;
const MIN_IN_FRAME_RATIO = 0.75;

function judgeFraming(box, vw, vh) {
    const crop = Math.min(vw, vh);
    const cropX = (vw - crop) / 2;
    const cropY = (vh - crop) / 2;

    if ((box.width * box.height) / (crop * crop) < MIN_FACE_AREA_RATIO) return { ok: false, reason: 'too_far' };

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (cx < cropX || cx > cropX + crop || cy < cropY || cy > cropY + crop) {
        return { ok: false, reason: 'partial_frame' };
    }

    const overlapW = Math.max(0, Math.min(box.x + box.width, cropX + crop) - Math.max(box.x, cropX));
    const overlapH = Math.max(0, Math.min(box.y + box.height, cropY + crop) - Math.max(box.y, cropY));
    if ((overlapW * overlapH) / (box.width * box.height) < MIN_IN_FRAME_RATIO) {
        return { ok: false, reason: 'partial_frame' };
    }
    return { ok: true };
}

// The old rule: whole box + 2% margin had to be inside the crop.
function judgeStrict(box, vw, vh) {
    const crop = Math.min(vw, vh);
    const cropX = (vw - crop) / 2, cropY = (vh - crop) / 2;
    if ((box.width * box.height) / (crop * crop) < MIN_FACE_AREA_RATIO) return { ok: false, reason: 'too_far' };
    const m = crop * 0.02;
    if (box.x < cropX + m || box.y < cropY + m || box.x + box.width > cropX + crop - m || box.y + box.height > cropY + crop - m) {
        return { ok: false, reason: 'partial_frame' };
    }
    return { ok: true };
}

const VW = 1280, VH = 720;           // typical webcam landscape frame
const CROP_X = (VW - VH) / 2;        // visible square starts at x=280
const centred = (size) => ({ x: (VW - size) / 2, y: (VH - size) / 2, width: size, height: size });

let fail = 0;
const t = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name} -> ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};

console.log('=== normal framing accepted ===');
t('260px centred face', judgeFraming(centred(260), VW, VH).ok, true);
t('160px centred face', judgeFraming(centred(160), VW, VH).ok, true);

console.log('\n--- regression: forehead clipped at top edge (the real-world failure) ---');
// Head high in frame, box starts at the very top — extremely common on webcams.
const foreheadClipped = { x: 520, y: 0, width: 260, height: 260 };
t('accepted by new rule', judgeFraming(foreheadClipped, VW, VH).ok, true);
t('  old strict rule wrongly rejected it', judgeStrict(foreheadClipped, VW, VH).reason, 'partial_frame');

// Slightly above the top edge (box origin negative) still fine: 90% visible.
const slightlyAbove = { x: 520, y: -26, width: 260, height: 260 };
t('10% clipped above top accepted', judgeFraming(slightlyAbove, VW, VH).ok, true);
t('  old strict rule rejected it', judgeStrict(slightlyAbove, VW, VH).reason, 'partial_frame');

console.log('\n=== genuinely out of shot still rejected ===');
// Centre outside the visible crop (person off to the left, behind the bezel).
t('face centre left of crop', judgeFraming({ x: 100, y: 230, width: 260, height: 260 }, VW, VH).reason, 'partial_frame');
// Mostly below the bottom edge.
t('face 70% below bottom', judgeFraming({ x: 520, y: 640, width: 260, height: 260 }, VW, VH).reason, 'partial_frame');
// Far away.
t('100px tiny face -> too_far', judgeFraming(centred(100), VW, VH).reason, 'too_far');

console.log('\n=== crop boundary maths ===');
t('crop starts at x=280', CROP_X, 280);
// Crop's right edge is at x=1000. A 260px box starting at 792 overlaps 208px
// of its width => 80% visible, and its centre (922) is still inside.
t('face at right edge, 80% visible', judgeFraming({ x: 792, y: 230, width: 260, height: 260 }, VW, VH).ok, true);
// Pushed further out: starts at 950 => only 50/260 = 19% visible.
t('face at right edge, 19% visible', judgeFraming({ x: 950, y: 230, width: 260, height: 260 }, VW, VH).reason, 'partial_frame');

console.log('\n=== other stream shapes ===');
t('square 480x480, centred 200px', judgeFraming({ x: 140, y: 140, width: 200, height: 200 }, 480, 480).ok, true);
t('square 480x480, 80px -> too_far', judgeFraming({ x: 200, y: 200, width: 80, height: 80 }, 480, 480).reason, 'too_far');
t('portrait 720x1280, centred 260px',
    judgeFraming({ x: (720 - 260) / 2, y: (1280 - 260) / 2, width: 260, height: 260 }, 720, 1280).ok, true);

console.log(fail === 0 ? '\nALL FRAMING TESTS PASSED' : `\n${fail} FAILURES`);
process.exit(fail ? 1 : 0);
