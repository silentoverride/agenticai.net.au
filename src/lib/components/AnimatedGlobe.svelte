<script lang="ts">
  import { geoEquirectangular, geoPath } from 'd3-geo';
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { feature, mesh } from 'topojson-client';
  import countriesTopology from 'world-atlas/countries-50m.json';
  import landTopology from 'world-atlas/land-50m.json';

  let container: HTMLDivElement;

  onMount(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ocean = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x062437
      })
    );
    group.add(ocean);

    const earthTexture = createEarthSilhouetteTexture();
    const land = new THREE.Mesh(
      new THREE.SphereGeometry(1.468, 128, 128),
      new THREE.MeshBasicMaterial({
        map: earthTexture,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      })
    );
    group.add(land);

    const cities = [
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Seoul', lat: 37.5665, lon: 126.978 },
      { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
      { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
      { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
      { name: 'London', lat: 51.5072, lon: -0.1276 },
      { name: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
      { name: 'Paris', lat: 48.8566, lon: 2.3522 },
      { name: 'Johannesburg', lat: -26.2041, lon: 28.0473 },
      { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
      { name: 'New York', lat: 40.7128, lon: -74.006 },
      { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
      { name: 'Miami', lat: 25.7617, lon: -80.1918 },
      { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
      { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
      { name: 'Sao Paulo', lat: -23.5558, lon: -46.6396 },
      { name: 'Santiago', lat: -33.4489, lon: -70.6693 }
    ];

    const cityMarkers: THREE.Mesh[] = [];

    cities.forEach((city) => {
      const node = new THREE.Mesh(
        new THREE.RingGeometry(0.018, 0.034, 24),
        new THREE.MeshBasicMaterial({
          color: 0xffc857,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.98,
          depthTest: false,
          depthWrite: false
        })
      );
      node.renderOrder = 10;
      placeOnGlobe(node, city.lat, city.lon, 1.505);
      group.add(node);
      cityMarkers.push(node);
    });

    const routePairs = [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 5],
      [3, 4],
      [4, 16],
      [5, 6],
      [6, 7],
      [7, 8],
      [7, 11],
      [8, 9],
      [9, 10],
      [8, 13],
      [11, 12],
      [12, 7],
      [13, 14],
      [13, 15],
      [13, 16],
      [16, 17],
      [17, 0],
      [17, 18],
      [18, 15],
      [15, 19],
      [19, 20],
      [20, 0],
      [3, 16],
      [2, 11],
      [9, 13]
    ];

    const routeAnimations: {
      curve: THREE.QuadraticBezierCurve3;
      offset: number;
      pulse: THREE.Mesh;
      trailGeometry: THREE.BufferGeometry;
    }[] = [];

    routePairs.forEach(([fromIndex, toIndex], index) => {
      const from = latLonToVector3(cities[fromIndex].lat, cities[fromIndex].lon, 1.49);
      const to = latLonToVector3(cities[toIndex].lat, cities[toIndex].lon, 1.49);
      const mid = from.clone().add(to).normalize().multiplyScalar(2.05);
      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      const route = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(96)),
        new THREE.LineBasicMaterial({
          color: 0x63f2df,
          transparent: true,
          opacity: 0.22,
          depthWrite: false
        })
      );
      group.add(route);

      const trailGeometry = new THREE.BufferGeometry();
      const trail = new THREE.Line(
        trailGeometry,
        new THREE.LineBasicMaterial({
          color: 0xffd166,
          transparent: true,
          opacity: 0.82,
          depthWrite: false
        })
      );
      group.add(trail);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.021, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff1a8, depthWrite: false })
      );
      group.add(pulse);
      routeAnimations.push({ pulse, curve, offset: index / routePairs.length, trailGeometry });
    });

    const ambient = new THREE.Mesh(
      new THREE.SphereGeometry(1.62, 96, 96),
      new THREE.MeshBasicMaterial({ color: 0x1083e1, transparent: true, opacity: 0.08 })
    );
    group.add(ambient);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const clock = new THREE.Clock();
    let animationFrame = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      group.rotation.y = elapsed * 0.16 + 1.55;
      group.rotation.x = 0.12;
      group.updateMatrixWorld();
      cityMarkers.forEach((marker) => {
        const worldPosition = new THREE.Vector3();
        marker.getWorldPosition(worldPosition);
        marker.visible = worldPosition.z > 0.08;
      });
      routeAnimations.forEach((route) => {
        const t = (elapsed * 0.18 + route.offset) % 1;
        route.pulse.position.copy(route.curve.getPoint(t));
        route.trailGeometry.setFromPoints(getTrailPoints(route.curve, t, 0.16, 20));
      });
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      earthTexture.dispose();
      renderer.domElement.remove();
    };
  });

  function latLonToVector3(lat: number, lon: number, radius: number) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function placeOnGlobe(object: THREE.Object3D, lat: number, lon: number, radius: number) {
    const position = latLonToVector3(lat, lon, radius);
    object.position.copy(position);
    object.lookAt(0, 0, 0);
  }

  function getTrailPoints(
    curve: THREE.QuadraticBezierCurve3,
    headPosition: number,
    trailLength: number,
    pointCount: number
  ) {
    const start = Math.max(0, headPosition - trailLength);
    const length = Math.max(headPosition - start, 0.001);

    return Array.from({ length: pointCount }, (_, index) => {
      const progress = index / (pointCount - 1);
      return curve.getPoint(start + length * progress);
    });
  }

  function createEarthSilhouetteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create globe texture context');
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(4, 223, 177, 0.88)';
    context.strokeStyle = 'rgba(212, 255, 249, 0.28)';
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';

    const topology = landTopology as unknown as {
      objects: { land: unknown };
    };
    const landFeature = feature(landTopology as never, topology.objects.land as never);
    const projection = geoEquirectangular()
      .scale(canvas.width / (2 * Math.PI))
      .translate([canvas.width / 2, canvas.height / 2])
      .precision(0.1);
    const path = geoPath(projection, context);

    context.beginPath();
    path(landFeature);
    context.fill();
    context.stroke();

    const countryTopology = countriesTopology as unknown as {
      objects: { countries: unknown };
    };
    const borders = mesh(
      countriesTopology as never,
      countryTopology.objects.countries as never,
      (left, right) => left !== right
    );

    context.strokeStyle = 'rgba(8, 42, 39, 0.48)';
    context.lineWidth = 1.15;
    context.beginPath();
    path(borders);
    context.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    return texture;
  }
</script>

<div class="animated-globe" bind:this={container} aria-label="Animated global infrastructure network"></div>

<style>
  .animated-globe {
    height: 100%;
    min-height: 24rem;
    width: 100%;
  }
</style>
