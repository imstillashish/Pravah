import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface MaritimeGlobeProps {
  className?: string;
  interactive?: boolean;
}

// Convert lat/long to 3D Cartesian coordinates on sphere with radius R
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// SAIL Coking Coal Ports
const PORTS = [
  { name: "Paradip (IN)", lat: 20.26, lon: 86.68, type: "dest" },
  { name: "Visakhapatnam (IN)", lat: 17.68, lon: 83.21, type: "dest" },
  { name: "Haldia (IN)", lat: 22.02, lon: 88.06, type: "dest" },
  { name: "Gladstone (AU)", lat: -23.84, lon: 151.25, type: "origin" },
  { name: "Hay Point (AU)", lat: -21.28, lon: 149.30, type: "origin" },
  { name: "Newcastle (AU)", lat: -32.92, lon: 151.78, type: "origin" },
  { name: "Taboneo (ID)", lat: -3.70, lon: 114.45, type: "origin" },
  { name: "Richards Bay (ZA)", lat: -28.78, lon: 32.03, type: "origin" },
  { name: "Maputo (MZ)", lat: -25.96, lon: 32.57, type: "origin" },
];

// Major Trade Lanes: [originIdx, destIdx]
const LANES = [
  [3, 0], // Gladstone -> Paradip
  [4, 1], // Hay Point -> Vizag
  [5, 2], // Newcastle -> Haldia
  [6, 0], // Taboneo -> Paradip
  [6, 1], // Taboneo -> Vizag
  [7, 2], // Richards Bay -> Haldia
  [8, 1], // Maputo -> Vizag
];

export const MaritimeGlobe: React.FC<MaritimeGlobeProps> = ({
  className = "",
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 300;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Initial orientation: Tilt towards Indian Ocean
    globeGroup.rotation.x = 0.25;
    globeGroup.rotation.y = -1.2;

    const RADIUS = 80;

    // 1. Dark forest ink inner sphere (Wise theme)
    const sphereGeo = new THREE.SphereGeometry(RADIUS - 0.5, 36, 36);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x112800,
      transparent: true,
      opacity: 0.88,
    });
    const innerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(innerSphere);

    // 2. Graticule / Wireframe lines with subtle lime accent
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(RADIUS, 24, 24));
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x9fe870,
      transparent: true,
      opacity: 0.20,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    globeGroup.add(wireframe);

    // 2b. Atmospheric outer ring / halo
    const haloGeo = new THREE.RingGeometry(RADIUS + 1, RADIUS + 4, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x9fe870,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    globeGroup.add(haloMesh);

    // 3. Trade route arcs & animated vessel pings
    const arcCurves: THREE.CubicBezierCurve3[] = [];
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    LANES.forEach(([oIdx, dIdx]) => {
      const origin = PORTS[oIdx];
      const dest = PORTS[dIdx];
      const p1 = latLongToVector3(origin.lat, origin.lon, RADIUS);
      const p2 = latLongToVector3(dest.lat, dest.lon, RADIUS);

      // Midpoint projected outward for curvature
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      const altitude = RADIUS + distance * 0.25;
      mid.normalize().multiplyScalar(altitude);

      // Create smooth cubic curve
      const ctrl1 = new THREE.Vector3().addVectors(p1, mid).multiplyScalar(0.5).normalize().multiplyScalar(altitude * 0.96);
      const ctrl2 = new THREE.Vector3().addVectors(p2, mid).multiplyScalar(0.5).normalize().multiplyScalar(altitude * 0.96);
      const curve = new THREE.CubicBezierCurve3(p1, ctrl1, ctrl2, p2);
      arcCurves.push(curve);

      // Draw arc line with Lime Voltage (#9fe870)
      const points = curve.getPoints(50);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x9fe870,
        transparent: true,
        opacity: 0.85,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcGroup.add(arcLine);
    });

    // 4. Port markers with larger size
    const portPointsGeo = new THREE.BufferGeometry();
    const portPositions: number[] = [];
    const portColors: number[] = [];

    PORTS.forEach((p) => {
      const v = latLongToVector3(p.lat, p.lon, RADIUS + 1.2);
      portPositions.push(v.x, v.y, v.z);
      if (p.type === "dest") {
        // Lime Voltage for Indian discharge terminals (#9fe870: 0.62, 0.91, 0.44)
        portColors.push(0.62, 0.91, 0.44);
      } else {
        // Warm amber for loading ports
        portColors.push(0.98, 0.75, 0.28);
      }
    });

    portPointsGeo.setAttribute("position", new THREE.Float32BufferAttribute(portPositions, 3));
    portPointsGeo.setAttribute("color", new THREE.Float32BufferAttribute(portColors, 3));

    const portMat = new THREE.PointsMaterial({
      size: 9,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });
    const portPoints = new THREE.Points(portPointsGeo, portMat);
    globeGroup.add(portPoints);

    // 5. Active vessel transit pings (sprites/particles moving along arcs)
    const vesselCount = arcCurves.length;
    const vesselGeo = new THREE.BufferGeometry();
    const vesselPositions = new Float32Array(vesselCount * 3);
    vesselGeo.setAttribute("position", new THREE.BufferAttribute(vesselPositions, 3));

    const vesselMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 7,
      transparent: true,
      opacity: 1.0,
    });
    const vesselPoints = new THREE.Points(vesselGeo, vesselMat);
    globeGroup.add(vesselPoints);

    // Drag / Touch rotation state
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      autoRotate = false;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive || !isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.006;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        autoRotate = true;
      }, 1500);
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 300;
      height = container.clientHeight || 300;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let animId: number;
    let progress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate) {
        globeGroup.rotation.y += 0.0025;
      }

      progress += 0.0035;
      if (progress > 1) progress = 0;

      // Update moving vessel positions
      const positions = vesselGeo.attributes.position.array as Float32Array;
      arcCurves.forEach((curve, i) => {
        const offsetProg = (progress + i * 0.14) % 1;
        const pt = curve.getPoint(offsetProg);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
      });
      vesselGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      portPointsGeo.dispose();
      portMat.dispose();
      vesselGeo.dispose();
      vesselMat.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative cursor-grab active:cursor-grabbing select-none ${className}`}
      title="Interactive Maritime Route Globe — Drag to rotate trade lanes"
    />
  );
};
