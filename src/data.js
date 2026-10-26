export const PLANETS = [
  {
    key: 'skills',
    label: 'Skills',
    blurb: 'React · GSAP · Three.js · Figma',
    maps: { map: '/textures/skills_texture.jpg' },
    ring: true,
    atm: [0.55, 0.45, 0.95],
  },
  {
    key: 'projects',
    label: 'Projects',
    blurb: 'Case studies, builds and experiments',
    maps: { map: '/textures/projects_texture.jpg', clouds: '/textures/projects_clouds.jpg' },
    sats: [
      { r: 2.4, size: 0.22, tilt: 0.3, color: '#e8c07a' },
      { r: 2.9, size: 0.16, tilt: -0.4, color: '#9ad0c0' },
      { r: 3.4, size: 0.28, tilt: 0.9, color: '#c9a0ff' },
    ],
    atm: [0.35, 0.6, 1],
  },
  {
    key: 'experience',
    label: 'Experience',
    blurb: 'Roles and work timeline',
    maps: { map: '/textures/experience_texture.jpg', bump: '/textures/experience_bump.jpg' },
    moon: true,
    atm: [1, 0.62, 0.35],
  },
  {
    key: 'contact',
    label: 'Contact',
    blurb: 'Email, GitHub, LinkedIn',
    maps: { map: '/textures/moon_texture.jpg', bump: '/textures/moon_bump.jpg' },
    atm: [0.8, 0.85, 1],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    blurb: 'Share your experience',
    maps: { map: '/textures/reviews_texture.jpg' },
    sats: [0, 1, 2, 3, 4].map((i) => ({
      r: 2.2 + i * 0.18,
      size: 0.09,
      tilt: i * 0.6 - 1.2,
      color: '#ffe9a8',
      emissive: '#ffd36b',
    })),
    atm: [0.45, 0.95, 0.8],
  },
]
export const ORDER = ['about', 'skills', 'projects', 'experience', 'reviews', 'contact'] // the journey, in order
export const NAV = ORDER
export const SECTIONS = {
  about: {
    label: 'About',
    title: 'About me',
    para: 'I am a developer who likes turning design into fast, responsive and playful experiences. I move from Figma to code to motion and 3D.',
    kind: 'about',
    stats: [
      ['1+', 'Years learning'],
      ['1', 'Projects built'],
      ['5', 'Tech stack'],
    ],
  },
  skills: {
    label: 'Skills',
    title: 'What I work with',
    para: 'From the first sketch in Figma to a responsive, animated and three-dimensional web experience.',
    kind: 'chips',
    groups: [
      ['DESIGN', ['Figma', 'UI design', 'Prototyping']],
      ['FRONTEND', ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive design']],
      ['MOTION AND 3D', ['GSAP', 'ScrollTrigger', 'Three.js', 'React Three Fiber']],
    ],
  },
  projects: {
    label: 'Projects',
    title: 'Things I have built',
    para: 'Projects where design, React, GSAP animation and 3D come together.',
    kind: 'cards',
    items: [
      [
        '01',
        'Project one',
      ],
      [
        '02',
        'Project two',
      ],
      [
        '03',
        'Project three',
      ],
    ],
  },
  experience: {
    label: 'Experience',
    title: 'Where I have worked',
    para: 'The roles and projects that shaped how I design and build for the web.',
    kind: 'cards',
    timeline: true,
    items: [
      [],
    ],
  },
  contact: {
    label: 'Contact',
    title: 'Let us talk',
    para: 'Have a project, an idea or an opportunity? Send a message.',
    kind: 'links',
    items: [
      ['EMAIL', 'apurvxofficial@gmail.com', 'mailto:apurvxofficial@gmail.com'],
      ['GITHUB', 'github.com/apurvches', 'https://github.com/apurvches'],
      ['LINKEDIN', 'linkedin.com/in/apurv-soni-32014036a', 'https://linkedin.com/in/apurv-soni-32014036a'],
    ],
  },
  reviews: {
    label: 'Reviews',
    title: 'Share your experience',
    para: 'Worked with me or explored the portfolio? Leave a short review and a rating.',
    kind: 'form',
  },
}
