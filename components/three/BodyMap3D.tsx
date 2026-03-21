'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { cn } from '@/utils';
import type { BodyPart } from '@/types';

const BODY_PART_SYMPTOMS: Record<BodyPart, string[]> = {
  head: ['Headache', 'Migraine', 'Dizziness', 'Head pain', 'Concussion', 'Hair loss'],
  neck: ['Neck pain', 'Stiff neck', 'Sore throat', 'Difficulty swallowing', 'Neck swelling'],
  chest: ['Chest pain', 'Shortness of breath', 'Palpitations', 'Tightness', 'Cough', 'Wheezing'],
  upper_back: ['Upper back pain', 'Muscle spasm', 'Shoulder pain', 'Stiffness'],
  lower_back: ['Lower back pain', 'Sciatica', 'Lumbar pain', 'Disc pain'],
  abdomen: ['Stomach pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Bloating', 'Cramps'],
  left_arm: ['Left arm pain', 'Weakness', 'Numbness', 'Tingling', 'Joint pain'],
  right_arm: ['Right arm pain', 'Weakness', 'Numbness', 'Tingling', 'Tennis elbow'],
  left_hand: ['Hand pain', 'Swelling', 'Numbness', 'Tremor', 'Arthritis'],
  right_hand: ['Hand pain', 'Swelling', 'Carpal tunnel', 'Arthritis'],
  left_leg: ['Leg pain', 'Cramps', 'Swelling', 'Weakness', 'Varicose veins'],
  right_leg: ['Leg pain', 'Cramps', 'Knee pain', 'Shin splints'],
  left_foot: ['Foot pain', 'Plantar fasciitis', 'Swelling', 'Numbness'],
  right_foot: ['Foot pain', 'Bunion', 'Heel pain', 'Ingrown toenail'],
  pelvis: ['Pelvic pain', 'Hip pain', 'Groin pain', 'Bladder issues', 'Lower abdominal pain'],
  skin: ['Rash', 'Itching', 'Acne', 'Hives', 'Eczema', 'Psoriasis', 'Burns'],
  eyes: ['Eye pain', 'Blurred vision', 'Redness', 'Discharge', 'Dry eyes', 'Conjunctivitis'],
  ears: ['Ear pain', 'Hearing loss', 'Tinnitus', 'Ear infection', 'Vertigo'],
  nose: ['Runny nose', 'Blocked nose', 'Nosebleed', 'Sinusitis', 'Loss of smell'],
  throat: ['Sore throat', 'Difficulty swallowing', 'Hoarseness', 'Tonsillitis', 'Strep throat'],
};

// Map mesh names to body parts
const MESH_TO_PART: Record<string, BodyPart> = {
  Head: 'head', head: 'head',
  Neck: 'neck', neck: 'neck',
  Chest: 'chest', chest: 'chest', Torso: 'chest',
  UpperBack: 'upper_back', upper_back: 'upper_back',
  LowerBack: 'lower_back', Spine: 'lower_back',
  Abdomen: 'abdomen', abdomen: 'abdomen', Stomach: 'abdomen',
  LeftArm: 'left_arm', Left_Arm: 'left_arm',
  RightArm: 'right_arm', Right_Arm: 'right_arm',
  LeftHand: 'left_hand', Left_Hand: 'left_hand',
  RightHand: 'right_hand', Right_Hand: 'right_hand',
  LeftLeg: 'left_leg', Left_Leg: 'left_leg',
  RightLeg: 'right_leg', Right_Leg: 'right_leg',
  LeftFoot: 'left_foot', Left_Foot: 'left_foot',
  RightFoot: 'right_foot', Right_Foot: 'right_foot',
  Pelvis: 'pelvis', Hips: 'pelvis',
};

// Body part display labels
const BODY_PART_LABELS: Record<BodyPart, string> = {
  head: 'Head', neck: 'Neck', chest: 'Chest',
  upper_back: 'Upper Back', lower_back: 'Lower Back',
  abdomen: 'Abdomen', left_arm: 'Left Arm', right_arm: 'Right Arm',
  left_hand: 'Left Hand', right_hand: 'Right Hand',
  left_leg: 'Left Leg', right_leg: 'Right Leg',
  left_foot: 'Left Foot', right_foot: 'Right Foot',
  pelvis: 'Pelvis', skin: 'Skin', eyes: 'Eyes',
  ears: 'Ears', nose: 'Nose', throat: 'Throat',
};

// Clickable regions (procedural, no GLTF needed)
const BODY_REGIONS: Array<{ part: BodyPart; position: THREE.Vector3; size: [number, number, number]; color: number }> = [
  { part: 'head', position: new THREE.Vector3(0, 1.7, 0), size: [0.25, 0.28, 0.25], color: 0xf8d7c4 },
  { part: 'neck', position: new THREE.Vector3(0, 1.45, 0), size: [0.1, 0.1, 0.1], color: 0xf8c4a0 },
  { part: 'chest', position: new THREE.Vector3(0, 1.25, 0), size: [0.3, 0.22, 0.18], color: 0xf2b888 },
  { part: 'abdomen', position: new THREE.Vector3(0, 1.0, 0), size: [0.28, 0.2, 0.15], color: 0xf2b888 },
  { part: 'pelvis', position: new THREE.Vector3(0, 0.78, 0), size: [0.28, 0.14, 0.15], color: 0xeaa878 },
  { part: 'upper_back', position: new THREE.Vector3(0, 1.25, -0.2), size: [0.3, 0.22, 0.05], color: 0xf2b888 },
  { part: 'lower_back', position: new THREE.Vector3(0, 1.0, -0.2), size: [0.28, 0.2, 0.05], color: 0xeaa878 },
  { part: 'left_arm', position: new THREE.Vector3(-0.45, 1.2, 0), size: [0.1, 0.35, 0.1], color: 0xf2b888 },
  { part: 'right_arm', position: new THREE.Vector3(0.45, 1.2, 0), size: [0.1, 0.35, 0.1], color: 0xf2b888 },
  { part: 'left_hand', position: new THREE.Vector3(-0.5, 0.8, 0), size: [0.1, 0.1, 0.06], color: 0xedb090 },
  { part: 'right_hand', position: new THREE.Vector3(0.5, 0.8, 0), size: [0.1, 0.1, 0.06], color: 0xedb090 },
  { part: 'left_leg', position: new THREE.Vector3(-0.14, 0.52, 0), size: [0.12, 0.38, 0.12], color: 0xedb090 },
  { part: 'right_leg', position: new THREE.Vector3(0.14, 0.52, 0), size: [0.12, 0.38, 0.12], color: 0xedb090 },
  { part: 'left_foot', position: new THREE.Vector3(-0.14, 0.1, 0.05), size: [0.1, 0.07, 0.18], color: 0xe8a87c },
  { part: 'right_foot', position: new THREE.Vector3(0.14, 0.1, 0.05), size: [0.1, 0.07, 0.18], color: 0xe8a87c },
];

interface BodyMap3DProps {
  selectedParts: BodyPart[];
  onPartSelect: (part: BodyPart) => void;
  className?: string;
}

export function BodyMap3D({ selectedParts, onPartSelect, className }: BodyMap3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    meshes: Map<BodyPart, THREE.Mesh>;
    animId: number;
  } | null>(null);
  const [hovered, setHovered] = useState<BodyPart | null>(null);

  const NORMAL_COLOR = 0xf2b888;
  const HOVER_COLOR = 0x38bdf8;
  const SELECTED_COLOR = 0x0ea5e9;
  const SELECTED_EMISSIVE = 0x0369a1;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 5, 15);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 3.2);
    camera.lookAt(0, 1.1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88ccff, 0.4);
    fill.position.set(-2, 2, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x0ea5e9, 0.3);
    rim.position.set(0, 0, -3);
    scene.add(rim);

    // Grid floor
    const gridHelper = new THREE.GridHelper(6, 20, 0x1e293b, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Build body mesh map
    const meshes = new Map<BodyPart, THREE.Mesh>();

    BODY_REGIONS.forEach(({ part, position, size, color }) => {
      const geo = new THREE.BoxGeometry(...size);
      // Round the box using custom vertex manipulation for organic look
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.0,
        emissive: 0x000000,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.name = part;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.set(part, mesh);
    });

    // Connecting cylinder segments for body continuity
    const addCylinder = (from: THREE.Vector3, to: THREE.Vector3, radius: number) => {
      const direction = to.clone().sub(from);
      const length = direction.length();
      const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xf2b888, roughness: 0.7 });
      const cyl = new THREE.Mesh(geo, mat);
      cyl.position.copy(from.clone().lerp(to, 0.5));
      cyl.lookAt(to);
      cyl.rotateX(Math.PI / 2);
      scene.add(cyl);
    };

    // Auto-rotate
    let theta = 0;
    let autoRotate = true;
    let isDragging = false;
    let prevX = 0;
    let rotY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const bodyMeshes = Array.from(meshes.values());
      const hits = raycaster.intersectObjects(bodyMeshes);
      if (hits.length > 0) {
        const part = hits[0].object.name as BodyPart;
        setHovered(part);
        container.style.cursor = 'pointer';
        // Hover highlight
        bodyMeshes.forEach(m => {
          const mat = m.material as THREE.MeshStandardMaterial;
          const p = m.name as BodyPart;
          if (selectedParts.includes(p)) {
            mat.color.setHex(SELECTED_COLOR);
            mat.emissive.setHex(SELECTED_EMISSIVE);
          } else if (p === part) {
            mat.color.setHex(HOVER_COLOR);
            mat.emissive.setHex(0x0c4a6e);
          } else {
            const orig = BODY_REGIONS.find(r => r.part === p);
            mat.color.setHex(orig?.color || NORMAL_COLOR);
            mat.emissive.setHex(0x000000);
          }
        });
        if (isDragging) {
          autoRotate = false;
          rotY += (e.clientX - prevX) * 0.01;
          prevX = e.clientX;
        }
      } else {
        setHovered(null);
        container.style.cursor = 'grab';
        if (!isDragging) {
          bodyMeshes.forEach(m => {
            const mat = m.material as THREE.MeshStandardMaterial;
            const p = m.name as BodyPart;
            if (selectedParts.includes(p)) {
              mat.color.setHex(SELECTED_COLOR);
              mat.emissive.setHex(SELECTED_EMISSIVE);
            } else {
              const orig = BODY_REGIONS.find(r => r.part === p);
              mat.color.setHex(orig?.color || NORMAL_COLOR);
              mat.emissive.setHex(0x000000);
            }
          });
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Array.from(meshes.values()));
      if (hits.length > 0) {
        const part = hits[0].object.name as BodyPart;
        onPartSelect(part);
        // Visual pulse effect
        const mesh = meshes.get(part);
        if (mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1;
          setTimeout(() => { mat.emissiveIntensity = 0.3; }, 200);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevX = e.clientX; autoRotate = false; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseLeave = () => { isDragging = false; setTimeout(() => { autoRotate = true; }, 2000); };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      prevX = e.touches[0].clientX;
      autoRotate = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      rotY += (e.touches[0].clientX - prevX) * 0.01;
      prevX = e.touches[0].clientX;
    };
    const onTouchEnd = () => { isDragging = false; setTimeout(() => { autoRotate = true; }, 2000); };
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    // Animate
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate) {
        theta += 0.003;
        rotY = Math.sin(theta) * 0.3;
      }
      scene.rotation.y = rotY;
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);

    sceneRef.current = { scene, camera, renderer, meshes, animId };

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update selected mesh colors when selection changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { meshes } = sceneRef.current;
    meshes.forEach((mesh, part) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (selectedParts.includes(part)) {
        mat.color.setHex(SELECTED_COLOR);
        mat.emissive.setHex(SELECTED_EMISSIVE);
        mat.emissiveIntensity = 0.3;
      } else {
        const orig = BODY_REGIONS.find(r => r.part === part);
        mat.color.setHex(orig?.color || NORMAL_COLOR);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [selectedParts]);

  return (
    <div className={cn('relative rounded-2xl overflow-hidden', className)}>
      <div ref={mountRef} className="three-canvas w-full h-full" style={{ minHeight: 480 }} />

      {/* Overlay info */}
      {hovered && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 pointer-events-none">
          📍 {BODY_PART_LABELS[hovered]} — click to select
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-xs text-white/50 pointer-events-none">
        <div>🖱 Drag to rotate</div>
        <div>👆 Click to select region</div>
      </div>

      {/* Selected count */}
      {selectedParts.length > 0 && (
        <div className="absolute top-4 right-4 bg-pharma-500/20 backdrop-blur-sm border border-pharma-500/30 text-pharma-300 px-3 py-1.5 rounded-full text-xs font-medium">
          {selectedParts.length} area{selectedParts.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}

// Symptom selector for selected body part
export function SymptomSelector({
  bodyPart,
  selected,
  onToggle,
}: {
  bodyPart: BodyPart;
  selected: string[];
  onToggle: (s: string) => void;
}) {
  const symptoms = BODY_PART_SYMPTOMS[bodyPart] || [];
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <span>Symptoms in {BODY_PART_LABELS[bodyPart]}</span>
      </h4>
      <div className="flex flex-wrap gap-2">
        {symptoms.map(s => (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
              selected.includes(s)
                ? 'bg-pharma-500 text-white border-pharma-500'
                : 'border-border hover:border-pharma-300 hover:bg-pharma-50 dark:hover:bg-pharma-900/20'
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export { BODY_PART_LABELS, BODY_PART_SYMPTOMS };
