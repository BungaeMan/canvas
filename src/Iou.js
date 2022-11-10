import { React, useState, useRef, useEffect } from "react";

function Iou(r1, r2) {
  if (r1.x > r2.x + r2.w) return false;
  if (r1.x + r1.w < r2.x) return false;
  if (r1.y > r2.y + r2.h) return false;
  if (r1.y + r1.h < r2.y) return false;
  const rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
  rect.x = Math.max(r1.x, r2.x);
  rect.y = Math.max(r1.y, r2.y);
  rect.w = Math.min(r1.x + r1.w, r2.x + r2.w) - rect.x;
  rect.h = Math.min(r1.y + r1.h, r2.y + r2.h) - rect.y;
  const size = rect.w * rect.h;
  const combine = r1.w * r1.h + r2.w * r2.h - size;
  const iou = size / combine;
  return iou;
}

export default Iou;
