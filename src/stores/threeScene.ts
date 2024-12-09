import { writable } from 'svelte/store';
import type ThreeScene from '../components/ThreeScene.svelte';

export const threeSceneStore = writable<ThreeScene | null>(null);
