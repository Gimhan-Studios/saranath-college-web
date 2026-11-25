import { hashPassword, passwordProblems, utcnowStr } from './security.ts'
import { store, uniqueSlug } from './store.ts'

const M = '/media/seed/'

export function seedDatabase(): void {
  if (store.houses.length > 0) return

  const ts = utcnowStr()

  store.schoolSettings = {
    name: 'Saranath College',
    location: 'Kuliyapitiya',
    founded: 1882,
    motto_si: 'පඤ්ඤා නරානං රතනං',
    motto_en: 'Wisdom is the jewel of humankind',
    tagline: 'A proud legacy of learning, unity and excellence since 1882.',
    intro_statement:
      'From thirty students in 1882 to generations of graduates, champions and leaders, Saranath College has stood as a home of learning, unity and pride.',
    address: 'Saranath College, Kuliyapitiya, Sri Lanka',
    phone: '+94 37 228 1355',
    email: '',
    facebook: 'https://www.facebook.com/p/Saranath-College-61556442792437/',
    youtube: '',
    map_embed_query: 'Saranath College Kuliyapitiya',
    office_hours: 'Mon to Fri, 7.30 am to 2.30 pm',
    hero_image: M + 'hero.webp',
    logo: M + 'crest-transparent.webp',
    stats: [
      { value: '1882', suffix: '', label: 'Founded' },
      { value: '30', suffix: '', label: 'First students' },
      { value: '500', suffix: '+', label: 'Students by 1941' },
      { value: '124', suffix: '', label: 'University entrants in 2017' },
    ],
    sports_meet_title: 'Inter-House Sports Meet',
    sports_meet_note: 'Points are updated by the sports committee during the meet.',
  }

  store.principalSettings = {
    name: 'Mr. R.M.C. Randeniya',
    title: 'Principal, Saranath College',
    photo: '',
    quote: 'Every great institution is built by those who came before us. Ours began with thirty students and a vision.',
    message:
      "It is with immense pride that I welcome you to Saranath College, Kuliyapitiya. Founded in 1882 under the leadership of Headmaster Anthony de Silva with just thirty students, our College has grown over more than a century into a place that has shaped thousands of lives.\n\n" +
      "Our history is one of courage and unity. We became a bilingual school in 1924, welcomed over 500 students by 1941, and in 1944 opened our doors to Sinhala, Tamil and English-medium students alike. In 1947, under Dr. C.W.W. Kannangara's vision of free education, we became a Central College, and ever since Saranath has carried that spirit of opportunity for every child.\n\n" +
      'We take pride not only in our past but in what our students achieve today. In 2017, 124 of our students earned university admission. Today, Saranath students bring home international honours in sports and co-curricular activities, a testament to their talent, discipline and the dedication of our teachers.\n\n' +
      'Since resuming duties as Principal in June 2021, it has been my privilege to lead the College through a period of significant academic and physical development, together with our committed staff, parents, past pupils and well-wishers.\n\n' +
      'Our motto, පඤ්ඤා නරානං රතනං, reminds us that wisdom is the true jewel of humankind. I invite every Saranathian, past and present, to carry that jewel with pride, and to keep our College shining for generations to come.',
  }

  const timeline: [string, string, string, string][] = [
    ['1882', '', 'The Beginning', 'The College was founded with 30 students under the leadership of Headmaster Anthony de Silva.'],
    ['1924', '', 'A Bilingual School', 'The school became a bilingual institution, widening the doors of learning.'],
    ['1941', '', 'Growing Strong', 'Enrolment grew to more than 500 students.'],
    ['1944', '', 'Three Languages, One School', 'The College became a mixed Sinhala, Tamil and English school, a proud symbol of unity.'],
    ['1947', '', 'A Central College', "Under Dr. C.W.W. Kannangara's free education policy, the school was elevated to a Central College."],
    ['1951', 'July 7', 'A New Chapter', 'The Central College was relocated to Meegahakotuwa, and the Sinhala, English and Tamil mixed school continued here as before.'],
    ['1977', '', 'Leadership', 'Mr. H.M. Dayananda Herath served as Principal of the College.'],
    ['2017', '', 'Academic Excellence', '124 students gained admission to state universities, a landmark result for the College.'],
    ['2021', 'June 14', 'A New Era of Development', 'Mr. R.M.C. Randeniya assumed duties as Principal for the second time, leading major academic and infrastructure development.'],
    ['Today', '', 'On the World Stage', 'Saranath students continue to win international honours in sports and co-curricular activities.'],
  ]
  timeline.forEach(([year, date_note, title, description], position) => {
    store.timeline.push({ id: store.nextId('timeline'), year, date_note, title, description, position, created_at: ts, updated_at: ts })
  })

  const houses: [string, string, string, string, string, string, string][] = [
    [
      'Thisara',
      'තිසර',
      'Royal Swan',
      'Crimson Red',
      '#d62839',
      'Purity, grace and wisdom',
      'Symbolised by the noble Swan (Hansa), renowned in Sinhala classical tradition for discerning truth from illusion with poise and dignity.',
    ],
    [
      'Mayura',
      'මයුර',
      'Emerald Peacock',
      'Emerald Green',
      '#15965a',
      'Vigour, pride and brilliance',
      'The Peacock represents vitality, pride and expressive beauty, bringing energy and confidence to every house activity.',
    ],
    [
      'Lihini',
      'ලිහිණි',
      'Swift Tern',
      'Sapphire Blue',
      '#2f66ef',
      'Swiftness, focus and boundless horizons',
      'The Swift Tern stands for speed, focus and the courage to reach beyond familiar horizons.',
    ],
    [
      'Paravi',
      'පරවි',
      'Messenger Dove',
      'Royal Gold',
      '#e0a100',
      'Unity, brotherhood and devotion',
      'The Messenger Dove represents peace, unity and the steadfast spirit of a community that supports one another.',
    ],
  ]
  houses.forEach(([name, name_si, symbol, colour_name, color_hex, motto, description], position) => {
    store.houses.push({
      id: store.nextId('houses'),
      name,
      name_si,
      symbol,
      colour_name,
      color_hex,
      motto,
      description,
      points: 0,
      captain: '',
      position,
      created_at: ts,
      updated_at: ts,
    })
  })

  const levels: [string, string, string, string][] = [
    ['Grades 6 to 8', 'Junior Secondary', 'Build a strong foundation in languages, mathematics, science and the humanities while discovering new interests.', 'learning-together.webp'],
    ['Grades 9 to 11', 'Ordinary Level (O/L)', 'Develop knowledge across the school curriculum and prepare for the G.C.E. Ordinary Level examination.', 'student-community.webp'],
    ['Grades 12 to 13', 'Advanced Level (A/L)', 'Choose a subject stream, deepen your studies and prepare for further education and future careers.', 'science-activity.webp'],
  ]
  levels.forEach(([grade_range, name, description, img], position) => {
    store.levels.push({ id: store.nextId('levels'), grade_range, name, description, image: M + img, position, created_at: ts, updated_at: ts })
  })

  const streams: [string, string, string, string, string, string[], string][] = [
    [
      'Physical Science',
      'Science stream',
      'Mathematics, physics and the physical sciences.',
      'Engineering, physical sciences and technology.',
      'A rigorous stream for students interested in mathematics, physics and understanding how the world works.',
      ['Combined Mathematics', 'Physics', 'Chemistry', 'ICT'],
      'science-activity.webp',
    ],
    [
      'Biological Science',
      'Science stream',
      'Living systems, health and the natural environment.',
      'Health sciences, agriculture and biological research.',
      'Explore living systems and the natural world through scientific study and practical investigation.',
      ['Biology', 'Chemistry', 'Physics', 'Agricultural Science'],
      'community-service.webp',
    ],
    [
      'Commerce',
      'Business stream',
      'Business, accounting, economics and organisations.',
      'Business, finance, management and economics.',
      'Build an understanding of business and the economy while developing analytical and financial skills.',
      ['Accounting', 'Business Studies', 'Economics'],
      'student-community.webp',
    ],
    [
      'Arts',
      'Humanities stream',
      'Humanities, languages and social sciences.',
      'Education, law, media and social sciences.',
      'Study people, societies, languages and ideas through a choice of humanities and social science subjects.',
      ['Sinhala', 'English', 'Political Science', 'Geography', 'Buddhist Civilization', 'Mass Media'],
      'learning-together.webp',
    ],
    [
      'Technology',
      'Applied learning stream',
      'Applied science, engineering and technology.',
      'Engineering technology, IT and applied sciences.',
      'Connect scientific understanding with practical technology and real-world problem solving.',
      ['Engineering Technology / Bio Systems Technology', 'Science for Technology', 'ICT'],
      'science-activity.webp',
    ],
  ]
  streams.forEach(([name, category, focus, careers, description, subjects, img], position) => {
    store.streams.push({
      id: store.nextId('streams'),
      name,
      category,
      focus,
      careers,
      description,
      subjects,
      image: M + img,
      position,
      created_at: ts,
      updated_at: ts,
    })
  })

  const clubs: [string, 'club' | 'sport', string, string, string][] = [
    ['Media Unit', 'club', 'Media', 'Tell the stories behind school life through photography, video, writing and announcements.', 'school-celebration.webp'],
    ['School Prefect Board', 'club', 'Leadership', 'Support students and teachers while helping school activities run with care and responsibility.', 'students-together.webp'],
    ['Drama Society', 'club', 'Arts', 'Explore theatre, performance and storytelling through creative projects and productions.', 'music-performance.webp'],
    ['Music Society', 'club', 'Arts', 'Make music, practise together and bring creative energy to school celebrations.', 'school-celebration.webp'],
    ['Dance Society', 'club', 'Arts', 'Celebrate movement, creative expression and cultural traditions through dance.', 'music-performance.webp'],
    ['Science & ICT Society', 'club', 'Learning', 'Ask questions, experiment with ideas and develop practical technology skills.', 'science-activity.webp'],
    ['Literary & Debate Society', 'club', 'Learning', 'Share ideas and build confidence in reading, writing and public speaking.', 'learning-together.webp'],
    ['Environment & Community Service', 'club', 'Service', 'Contribute to projects that care for the school environment and the wider community.', 'community-service.webp'],
    ['Art & Craft Society', 'club', 'Arts', 'Experiment with visual art, design and hands-on creative projects.', 'student-sports.webp'],
    ['Athletics', 'sport', 'Track & Field', 'Sprints, distance, jumps and throws, with training for zonal, provincial and national meets.', 'track-and-field.webp'],
    ['Cricket', 'sport', 'Team sport', 'Under-13 to Under-19 squads competing in inter-school tournaments.', 'student-sports.webp'],
    ['Volleyball', 'sport', 'Team sport', 'Boys and girls teams building teamwork, fitness and competitive spirit.', 'student-sports.webp'],
    ['Badminton', 'sport', 'Racket sport', 'Indoor training and provincial-level competition.', 'student-sports.webp'],
  ]
  clubs.forEach(([name, kind, category, description, img], position) => {
    store.clubs.push({
      id: store.nextId('clubs'),
      name,
      kind,
      category,
      description,
      details: '',
      teacher_in_charge: '',
      image: M + img,
      position,
      created_at: ts,
      updated_at: ts,
    })
  })

  const news: [string, string, string, string, string, string, boolean][] = [
    [
      'Saranath Students Shine in G.C.E. A/L',
      'Academics',
      '2026-10-12',
      'Fifteen students achieved three A grades in the Physical Science stream.',
      'Saranath College celebrates the achievements of its G.C.E. Advanced Level batch.\n\nFifteen students achieved three A grades in the Physical Science stream, an outstanding result for the students and the school community.\n\nThe College congratulates all students who completed their examinations and wishes them success in their future studies.',
      'school-celebration.webp',
      true,
    ],
    [
      'Explore O/L and A/L Learning Pathways',
      'School Feature',
      '2026-09-02',
      'A quick guide to the secondary levels and subject streams at Saranath.',
      'Saranath College students progress through Junior Secondary, G.C.E. Ordinary Level and Advanced Level programmes.\n\nAt Advanced Level, the pathways include Physical Science, Biological Science, Commerce, Arts and Technology.\n\nSubject combinations and availability can vary. Please contact the school for current A/L options.',
      'learning-together.webp',
      false,
    ],
    [
      'Find Your Place in Student Life',
      'School Feature',
      '2026-08-20',
      'Explore student groups across media, the arts, learning, leadership and community service.',
      'Saranath College offers a range of clubs and societies for students to explore interests and develop skills.\n\nThe groups include media, drama, music, dance, science and ICT, literature and debate, art, and community service.',
      'students-together.webp',
      false,
    ],
  ]
  news.forEach(([title, category, date, excerpt, body, img, featured]) => {
    const id = store.nextId('news')
    store.news.push({
      id,
      slug: uniqueSlug(store.news, title),
      title,
      category,
      date,
      excerpt,
      body,
      image: M + img,
      image_alt: title,
      featured,
      published: true,
      created_at: ts,
      updated_at: ts,
    })
  })

  const events: [string, string, string, string, string, string, string, string][] = [
    [
      'Annual Inter-House Athletic Championship',
      'Sports',
      '2027-02-18',
      '8.00 am',
      'College Main Grounds, Meegahakotuwa',
      'Thisara, Mayura, Lihini and Paravi houses compete across track and field, march-past and relay finals.',
      '',
      'track-and-field.webp',
    ],
    [
      "Founders' Day & Prize Giving",
      'Ceremony',
      '2027-03-10',
      '9.00 am',
      'Main Hall',
      'Commemorating Headmaster Anthony de Silva and celebrating scholars, sports medallists and O/L and A/L achievers.',
      '',
      'school-celebration.webp',
    ],
    [
      'Science & Technology Exhibition',
      'Academic',
      '2027-04-04',
      '',
      'Science & Technology Block',
      'Students from the Science and Technology streams showcase projects and prototypes.',
      '',
      'science-activity.webp',
    ],
    [
      'Colours Night',
      'Sports',
      '2026-09-28',
      '',
      'Main Hall',
      'More than 200 sportsmen from 15 disciplines were recognised for their achievements.',
      'Students representing 15 disciplines were recognised for achievements at zonal, provincial and national levels.',
      'track-and-field.webp',
    ],
    [
      'Clubs & Societies Showcase',
      'Student Activities',
      '2026-09-12',
      '',
      'School Grounds',
      'Students shared projects and invited the school community to explore student groups.',
      '',
      'student-community.webp',
    ],
    [
      'Cultural Celebration',
      'Cultural',
      '2025-12-06',
      '',
      'Main Hall',
      'A programme of music, dance and tradition gave students a moment to perform and celebrate together.',
      '',
      'music-performance.webp',
    ],
    [
      'Prefect Investiture',
      'Ceremony',
      '2025-08-21',
      '',
      'Main Hall',
      'The school recognised a new group of student leaders and their commitment to service and responsibility.',
      '',
      'students-together.webp',
    ],
  ]
  events.forEach(([title, category, date, time, venue, excerpt, outcome, img]) => {
    const id = store.nextId('events')
    store.events.push({
      id,
      slug: uniqueSlug(store.events, title),
      title,
      category,
      date,
      time,
      venue,
      excerpt,
      body: excerpt,
      outcome,
      image: M + img,
      image_alt: title,
      published: true,
      created_at: ts,
      updated_at: ts,
    })
  })

  const gallery: [string, string, 'sport' | 'learning' | 'arts' | 'community' | 'events', 'normal' | 'wide' | 'tall'][] = [
    ['track-and-field.webp', 'Ready, set, go', 'sport', 'tall'],
    ['learning-together.webp', 'A classroom in session', 'learning', 'normal'],
    ['music-performance.webp', 'Lights up', 'arts', 'normal'],
    ['student-community.webp', 'Sharing ideas', 'community', 'wide'],
    ['science-activity.webp', 'Curiosity in action', 'learning', 'normal'],
    ['student-sports.webp', 'Teamwork outdoors', 'sport', 'normal'],
    ['school-grounds.webp', 'Our school grounds', 'community', 'wide'],
    ['religious.webp', 'Religious observance', 'community', 'wide'],
    ['hero.webp', 'The main building', 'community', 'normal'],
    ['school-celebration.webp', 'Celebrating together', 'events', 'normal'],
  ]
  gallery.forEach(([img, caption, category, size], position) => {
    store.gallery.push({
      id: store.nextId('gallery'),
      image: M + img,
      caption,
      alt: caption,
      category,
      size,
      position,
      created_at: ts,
      updated_at: ts,
    })
  })

  // Optional initial superadmin provisioned from environment variables
  const envUser = process.env.ADMIN_USERNAME?.trim()
  const envPass = process.env.ADMIN_PASSWORD
  if (envUser && envPass && store.users.length === 0) {
    const problem = passwordProblems(envPass, envUser)
    if (!problem) {
      store.users.push({
        id: store.nextId('users'),
        username: envUser,
        full_name: process.env.ADMIN_FULL_NAME?.trim() || 'Site Administrator',
        password_hash: hashPassword(envPass),
        role: 'superadmin',
        is_active: true,
        totp_secret_enc: null,
        totp_enabled: false,
        failed_logins: 0,
        locked_until: null,
        last_login_at: null,
        must_change_password: false,
        created_at: ts,
        updated_at: ts,
      })
    } else {
      console.warn('[Saranath] Ignoring ADMIN_PASSWORD from environment:', problem)
    }
  }
}
