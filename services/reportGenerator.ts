/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const generateHtmlReport = (data: any): string => {
    if (!data) return "";
    console.log("FULL REPORT JSON:", JSON.stringify(data, null, 2));

    const competitorsHtml = (data.competitors || []).slice(0, 5)
        .map((c: any, index: number) => {
            const isObj = typeof c === 'object';
            const name = isObj ? c.name : c;
            const reason = isObj ? c.reason : "Direct market competitor";
            const share = isObj ? c.market_share : 20;
            const caseStudy = isObj && c.case_study ? c.case_study : null;

            // Generate anchor for case study if it exists in data.case_studies
            const caseStudyAnchor = (data.case_studies || []).find((cs: any) =>
                cs.company?.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(cs.company?.toLowerCase())
            ) ? `#case-${index}` : '#case-studies';

            return `
            <div class="competitor-card ${index === 5 ? 'center-six' : ''}">
                <div class="rank-badge">#${index + 1}</div>
                <div class="comp-header">
                    <div class="comp-name">${name}</div>
                    <div class="comp-share">${share}% Share</div>
                </div>
                <div class="comp-reason-toggle" onclick="this.classList.toggle('active')">
                    <span class="reason-label">Why it's a competitor?</span>
                    <div class="comp-reason-box">
                        <p class="comp-reason">${reason}</p>
                        <a href="${caseStudyAnchor}" class="see-case-btn" onclick="event.stopPropagation();">
                            <span>See case study</span>
                            <span class="arrow">→</span>
                        </a>
                    </div>
                </div>
            </div>
        `}).join('');

    // Helper function to bold/underline important text
    const formatImportantText = (text: string): string => {
        // Bold numbers with %, $, or metrics
        text = text.replace(/(\d+%)/g, '<strong>$1</strong>');
        text = text.replace(/(\$\d+[KMB]?)/g, '<strong>$1</strong>');

        // Underline action words and key phrases
        const actionWords = ['must', 'should', 'critical', 'important', 'key', 'essential', 'required', 'focus on', 'prioritize'];
        actionWords.forEach(word => {
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            text = text.replace(regex, '<u><strong>$1</strong></u>');
        });

        return text;
    };

    // Helper to shorten long topic titles to 3-5 words
    const shortenTopic = (topic: string): string => {
        if (!topic) return "";
        const words = topic.split(/\s+/);
        if (words.length <= 5) return topic;

        // Pick primary keywords if it looks like a long sentence
        const keywords = words.filter(w => w.length > 3 && !['with', 'your', 'this', 'that'].includes(w.toLowerCase()));
        if (keywords.length > 3) {
            return keywords.slice(0, 4).join(' ') + '...';
        }
        return words.slice(0, 5).join(' ') + '...';
    };

    const solutionsHtml = (data.problem_solutions || [])
        .map((ps: any, pIndex: number) => {
            const videoUrl = ps.video_search_term
                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(ps.video_search_term)}`
                : null;

            // Map common problem domains to video labels
            const getLabel = (prob: string) => {
                const p = prob.toLowerCase();
                if (p.includes('financial') || p.includes('cash') || p.includes('money')) return 'Financial';
                if (p.includes('legal') || p.includes('regulat') || p.includes('complian')) return 'Legal';
                if (p.includes('competit') || p.includes('market') || p.includes('rival')) return 'Competitors';
                if (p.includes('brand') || p.includes('marketing') || p.includes('identit')) return 'Branding';
                return 'Solution';
            };
            const videoLabel = getLabel(ps.problem);

            return `
            <div class="category-header">
                <h3>${shortenTopic(ps.problem)}</h3>
            </div>
            <div class="card-grid">
                ${(ps.solutions || []).map((s: string, index: number) => {
                const parts = s.split(':');
                const title = parts[0].trim();
                const detail = parts.slice(1).join(':').trim();

                // Convert paragraph to bullet points with formatting
                const allBullets = detail
                    .split(/(?<!e\.g|i\.e)\.\s/g)
                    .filter(b => b.trim().length > 0)
                    .map(b => formatImportantText(b.trim().replace(/\.$/, '')));

                const cardId = `sol-${pIndex}-${index}`;
                const bulletHtml = allBullets.map(b => `<li>${b}</li>`).join('');

                return `
                        <div class="card" id="card-${cardId}">
                            <div class="card-topic">${title}</div>
                            <div class="card-content" id="${cardId}">
                                <ul class="detail-list" style="margin-top: 0;">
                                    ${bulletHtml}
                                </ul>
                            </div>
                            <button class="read-more-btn" onclick="toggleCard('${cardId}')">
                                <span class="btn-text">Read More</span>
                                <span class="arrow">↓</span>
                            </button>
                        </div>`;
            }).join('')}
            </div>
            ${videoUrl ? `
                <div class="problem-video-container">
                    <a href="${videoUrl}" target="_blank" class="video-btn-large">
                        <span>▶ Watch ${videoLabel} Guide</span>
                        <span style="font-size: 0.8rem;">⬀</span>
                    </a>
                </div>
            ` : ''}
        `}).join('');

    const caseStudiesHtml = (data.case_studies || []).slice(0, 5)
        .map((cs: any, index: number) => {
            // Try to find matching competitor to pull metrics
            const matchingComp = (data.competitors || []).find((c: any) =>
                typeof c === 'object' && (
                    c.name?.toLowerCase().includes(cs.company?.toLowerCase()) ||
                    cs.company?.toLowerCase().includes(c.name?.toLowerCase())
                )
            );
            const name = cs.company || 'Industry Leader';
            const share = matchingComp?.market_share || 20;
            const reason = matchingComp?.reason || "Leading market solution in this vertical.";
            const metrics = matchingComp?.case_study;

            return `
            <div class="case-study-card" id="case-${index}">
                <div class="case-top">
                    <div class="case-title-row">
                        <div class="check-icon">✓</div>
                        <div>
                            <div class="case-company">${name}</div>
                            <div class="share-badge">${share}% Market Share</div>
                        </div>
                    </div>
                    <div class="rank-pill">#${index + 1}</div>
                </div>

                <div class="why-block">
                    <span class="why-label">Why it's a competitor</span>
                    <p class="why-text">${reason}</p>
                </div>

                <div class="deepdive-content" id="deepdive-${index}" style="max-height: 0; overflow: hidden; transition: max-height 0.4s ease, opacity 0.3s ease; opacity: 0;">
                    ${metrics ? `
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="m-label">📅 FOUNDED</div>
                            <div class="m-value">${metrics.founded || 'N/A'}</div>
                        </div>
                        <div class="metric-item">
                            <div class="m-label">💲 FUNDING</div>
                            <div class="m-value cyan">${metrics.funding || 'N/A'}</div>
                        </div>
                        <div class="metric-item">
                            <div class="m-label">📈 REVENUE</div>
                            <div class="m-value cyan">${metrics.revenue || 'N/A'}</div>
                        </div>
                        <div class="metric-item">
                            <div class="m-label">👥 USERS</div>
                            <div class="m-value cyan">${metrics.users || 'N/A'}</div>
                        </div>
                    </div>

                    <div class="achievement-block">
                        <div class="a-label">🏆 KEY ACHIEVEMENT</div>
                        <div class="a-text">${metrics.key_metric || 'Dominant market position.'}</div>
                    </div>
                    ` : ''}

                    <div class="outcome-block">
                        <span class="o-label">KEY OUTCOME</span>
                        <p class="o-text">"${cs.outcome || 'Market success through innovation.'}"</p>
                    </div>
                </div>

                <button class="read-more-btn" onclick="toggleDeepdive('deepdive-${index}')" style="margin-top: 10px; background: rgba(34, 211, 238, 0.1); border-color: rgba(34, 211, 238, 0.3);">
                    <span class="btn-text">Deepdive</span>
                    <span class="arrow">↓</span>
                </button>
            </div>
        `}).join('');

    const sourcesHtml = (data.sources || [])
        .map((s: string) => {
            let url = s.trim();
            if (!url.startsWith('http')) url = 'https://' + url;
            // Get a clean display name (domain + first part of path)
            let display = url.replace(/^https?:\/\/(www\.)?/, '');
            if (display.length > 60) display = display.substring(0, 57) + '...';

            return `
                <li class="source-item">
                    <a href="${url}" target="_blank">${display}</a>
                </li>
            `;
        }).join('');

    // Extract phase titles and descriptions formatted as bullet points with formatting
    const roadmapHtml = (() => {
        if (!data.roadmap) return "No roadmap provided.";

        const phases = data.roadmap.split(/(?=Phase \d+)/).filter((p: string) => p.trim());

        return phases.map((phase: string, index: number) => {
            const match = phase.match(/(Phase \d+[^:]*):\s*([\s\S]*)/);
            if (!match) return '';

            const title = match[1].trim();
            const rawDesc = match[2].trim();

            let listItems = rawDesc.split(/\n\d+[\).]|\n-|\n\*/).filter(i => i.trim().length > 5);

            if (listItems.length <= 1) {
                listItems = rawDesc.split('. ').filter(i => i.trim().length > 5);
            }

            const descHtml = listItems.length > 0
                ? `<ul class="phase-list">${listItems.map(i => `<li>${formatImportantText(i.trim().replace(/\.$/, ''))}</li>`).join('')}</ul>`
                : `<p>${formatImportantText(rawDesc)}</p>`;

            const phaseId = `phase-${index}`;
            return `
                <div class="phase-block" id="card-${phaseId}">
                    <div class="phase-title" onclick="toggleCard('${phaseId}')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span>${title}</span>
                        <span class="arrow" style="font-size: 0.8rem; transition: transform 0.3s ease;">↓</span>
                    </div>
                    <div class="card-content" id="${phaseId}">
                        ${descHtml}
                    </div>
                </div>
            `;
        }).join('');
    })();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Strategic Analysis Report - Comprehensive Market Intelligence & Execution Strategy">
    <script src="https://unpkg.com/@antv/g2plot@latest/dist/g2plot.min.js"></script>
    <title>Strategic Analysis Report | Market Intelligence</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #080c10;
            --bg-secondary: #0d1217;
            --bg-card: #12181f;
            --bg-card-hover: #171f28;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --accent: #22d3ee;
            --accent-glow: rgba(34, 211, 238, 0.2);
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --border: rgba(255, 255, 255, 0.08);
            --radius: 20px;
            --radius-md: 12px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg-primary); color: var(--text-primary); line-height: 1.6; overflow-x: hidden; }
        
        body::before {
            content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            opacity: 0.02; pointer-events: none; z-index: 9999;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .bg-orbs { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, var(--accent) 0%, transparent 70%); top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, var(--success) 0%, transparent 70%); bottom: 10%; left: -150px; }

        .grid-lines {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;
            background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 80px 80px; mask-image: radial-gradient(ellipse at center, black 0%, transparent 80%);
        }

        .container { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }

        .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-radius: var(--radius); overflow: hidden; margin: 60px 0; border: 1px solid var(--border); }
        .stat { background: var(--bg-card); padding: 30px; text-align: center; }
        .stat-value { font-size: 2.5rem; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 8px; }
        .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }

        nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 16px 24px;
            background: rgba(8, 12, 16, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border);
        }
        nav .nav-content { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .nav-logo { font-weight: 700; font-size: 1.2rem; color: var(--text-primary); }
        .nav-links { display: flex; gap: 12px; }
        .nav-links a { 
            background: var(--accent); color: #000; padding: 8px 18px; border-radius: 100px; 
            text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: var(--transition); 
        }
        .nav-links a:hover { transform: translateY(-2px); box-shadow: 0 4px 15px var(--accent-glow); }

        header { padding: 140px 0 80px; text-align: center; }
        h1 { font-family: 'Playfair Display', serif; font-size: 4rem; margin-bottom: 20px; }
        h1 span { background: linear-gradient(135deg, var(--accent), var(--success)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .section-header { display: flex; align-items: center; gap: 20px; margin: 60px 0 30px; }
        .section-number { width: 50px; height: 50px; border-radius: 12px; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #000; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; }

        /* Solutions Grid */
        .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 30px; }
        .card { 
            background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); 
            padding: 28px; transition: var(--transition); position: relative;
        }
        .card:hover { border-color: var(--accent); transform: translateY(-5px); }
        .card-topic { font-size: 1.25rem; font-weight: 600; margin-bottom: 20px; line-height: 1.3; }
        .detail-list { list-style: none; margin-bottom: 20px; }
        .detail-list li { margin-bottom: 12px; color: var(--text-secondary); position: relative; padding-left: 20px; font-size: 0.95rem; }
        .detail-list li::before { content: '•'; position: absolute; left: 0; color: var(--accent); }
        
        /* Competitor Overview Grid */
        .competitor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .competitor-card { 
            background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); 
            padding: 20px; position: relative; transition: var(--transition);
        }
        .competitor-card:hover { border-color: var(--accent); transform: translateY(-3px); }
        .rank-badge { 
            position: absolute; top: -10px; right: 10px; background: var(--accent); color: #000;
            width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 0.75rem; box-shadow: 0 4px 10px var(--accent-glow);
        }
        .comp-name { font-weight: 600; font-size: 1rem; margin-bottom: 4px; }
        .comp-share { font-size: 0.75rem; color: var(--success); }
        .comp-reason-toggle { margin-top: 12px; cursor: pointer; color: var(--text-muted); font-size: 0.75rem; }
        .comp-reason-box { display: none; margin-top: 10px; animation: fadeIn 0.3s ease; }
        .comp-reason-toggle.active .comp-reason-box { display: block; }
        .comp-reason { color: var(--text-secondary); line-height: 1.4; }

        .read-more-btn { 
            background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--accent);
            padding: 8px 16px; border-radius: 100px; font-size: 0.85rem; font-weight: 500;
            cursor: pointer; display: flex; align-items: center; gap: 8px; transition: var(--transition);
            margin-top: 15px;
        }
        .read-more-btn:hover { background: var(--accent-glow); border-color: var(--accent); }
        .read-more-btn .arrow { transition: transform 0.3s ease; }
        .expanded .arrow { transform: rotate(180deg) !important; }

        .card-content { max-height: 0; overflow: hidden; transition: max-height 0.4s ease, opacity 0.3s ease; opacity: 0; }
        .expanded .card-content { max-height: 2000px !important; opacity: 1; margin-top: 15px; }

        /* Problem Video Highlight */
        .problem-video-container { 
            background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); 
            border-radius: var(--radius); padding: 50px; display: flex; justify-content: center; margin-bottom: 60px;
        }
        .video-btn-large {
            background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger);
            color: var(--danger); padding: 12px 30px; border-radius: 12px;
            font-size: 1rem; font-weight: 600; text-decoration: none;
            display: flex; align-items: center; gap: 12px; transition: var(--transition);
        }
        .video-btn-large:hover { background: rgba(239, 68, 68, 0.2); transform: scale(1.02); }

        /* Competitor Case Study Row */
        .case-study-card {
            background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
            padding: 40px; margin-bottom: 30px; position: relative;
        }
        .case-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .case-title-row { display: flex; align-items: center; gap: 15px; }
        .check-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: var(--success); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(16, 185, 129, 0.2); }
        .case-company { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 600; }
        .share-badge { font-size: 0.8rem; color: var(--success); background: rgba(16, 185, 129, 0.08); padding: 4px 12px; border-radius: 100px; margin-top: 8px; display: inline-block; font-weight: 500; }
        .rank-pill { width: 44px; height: 44px; border-radius: 50%; background: var(--accent); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; box-shadow: 0 0 20px var(--accent-glow); }

        .why-block { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px; }
        .why-label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 12px; display: block; }
        .why-text { font-size: 1.1rem; color: var(--text-primary); line-height: 1.5; }

        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .metric-item { background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; }
        .m-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .m-value { font-size: 1.2rem; font-weight: 700; color: #fff; }
        .m-value.cyan { color: var(--accent); }

        .achievement-block { background: rgba(34, 211, 238, 0.03); border: 1px solid rgba(34, 211, 238, 0.15); border-radius: var(--radius-md); padding: 24px; margin-bottom: 30px; }
        .a-label { font-size: 0.75rem; text-transform: uppercase; color: var(--accent); letter-spacing: 0.1em; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .a-text { font-size: 1.1rem; color: var(--success); font-weight: 600; }

        .outcome-block { border-top: 1px solid var(--border); padding-top: 24px; }
        .o-label { font-size: 0.75rem; text-transform: uppercase; color: var(--success); letter-spacing: 0.1em; margin-bottom: 12px; display: block; }
        .o-text { font-size: 1.25rem; color: var(--text-secondary); font-style: italic; font-weight: 300; line-height: 1.5; }

        /* Roadmap Vertical Timeline */
        .roadmap { padding-left: 30px; border-left: 2px solid var(--border); position: relative; }
        .phase-block { padding-bottom: 50px; position: relative; }
        .phase-block::before { content: ''; position: absolute; left: -39px; top: 10px; width: 16px; height: 16px; border-radius: 50%; background: var(--warning); border: 4px solid var(--bg-primary); }
        .phase-title { font-size: 1.35rem; font-weight: 700; color: var(--warning); margin-bottom: 20px; }
        .phase-list { list-style: none; }
        .phase-list li { color: var(--text-secondary); margin-bottom: 15px; font-size: 1.05rem; position: relative; padding-left: 20px; }
        .phase-list li::before { content: '•'; position: absolute; left: 0; color: var(--warning); }
        .phase-list li strong { color: var(--accent); font-weight: 600; }

        @media (max-width: 1024px) {
            .card-grid { grid-template-columns: repeat(2, 1fr); }
            .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
            h1 { font-size: 2.5rem; }
            .card-grid { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: 1fr; }
        }

        /* PDF / Print Optimizations */
        @media print {
            body { background: #080c10 !important; -webkit-print-color-adjust: exact; }
            .bg-orbs, .grid-lines, nav, .read-more-btn { display: none !important; }
            .container { padding: 0 !important; max-width: 100% !important; }
            section { page-break-inside: avoid; margin-bottom: 40px !important; }
            .card-content, .deepdive-content { max-height: none !important; opacity: 1 !important; display: block !important; margin-top: 15px !important; }
            .card, .case-study-card { page-break-inside: avoid; border: 1px solid rgba(255,255,255,0.1) !important; }
            .detail-list { padding-bottom: 10px; }
            h1 span { -webkit-text-fill-color: initial !important; color: var(--accent) !important; }
            .roadmap { border-left-color: var(--warning) !important; }
        }
    </style>
</head>
<body>
    <!-- Background Elements -->
    <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
    </div>
    <div class="grid-lines"></div>

    <!-- Navigation -->
    <nav>
        <div class="nav-content">
            <div class="nav-logo">IDA Intelligence</div>
            <div class="nav-links">
                <a href="#competitors">Competitors</a>
                <a href="#solutions">Solutions</a>
                <a href="#case-studies">Case Studies</a>
                <a href="#roadmap">Roadmap</a>
                <a href="#" onclick="toggleSources(event)">Research Sources</a>
            </div>
        </div>
    </nav>

    <!-- Main Container -->
    <div class="container">
        <header>
            <div class="badge">
                <span>Strategic Analysis</span>
            </div>
            <h1><span>Market Intelligence Report</span></h1>
            <p class="subtitle">Comprehensive competitive analysis and execution roadmap for strategic decision-making</p>
        </header>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat">
                <div class="stat-value">${(data.competitors || []).length}</div>
                <div class="stat-label">Competitors Analyzed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(data.problem_solutions || []).reduce((acc: number, ps: any) => acc + (ps.solutions || []).length, 0)}</div>
                <div class="stat-label">Strategic Solutions</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(data.case_studies || []).length}</div>
                <div class="stat-label">Case Studies</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(data.sources || []).length}</div>
                <div class="stat-label">Research Sources</div>
            </div>
        </div>

        <!-- Section 1: Competitors -->
        <section id="competitors">
            <div class="section-header">
                <div class="section-number">1</div>
                <div class="section-title">Top 5 Competitors</div>
            </div>
            <div class="competitor-grid">
                ${competitorsHtml}
            </div>
            <div id="competitor-chart"></div>
        </section>

        <!-- Section 2: Solutions -->
        <section id="solutions">
            <div class="section-header">
                <div class="section-number">2</div>
                <div class="section-title">Strategic Solutions</div>
            </div>
            ${solutionsHtml}
        </section>

        <!-- Section 3: Case Studies -->
        <section id="case-studies">
            <div class="section-header">
                <div class="section-number">3</div>
                <div class="section-title">Case Studies</div>
            </div>
            ${caseStudiesHtml}
        </section>

        <!-- Section 4: Sources (Hidden by default) -->
        <div id="sources-section" style="display: none;">
            <section>
                <div class="section-header">
                    <div class="section-number">4</div>
                    <div class="section-title">Verified Sources</div>
                </div>
                <ul class="source-list">
                    ${sourcesHtml}
                </ul>
            </section>
        </div>

        <!-- Section 5: Roadmap -->
        <section id="roadmap">
            <div class="section-header">
                <div class="section-number">5</div>
                <div class="section-title">Execution Roadmap</div>
            </div>
            <div class="roadmap">
                ${roadmapHtml}
            </div>
        </section>

        <!-- Footer -->
        <footer>
            <div class="footer-content">
                <span class="footer-text">Generated by</span>
                <span class="footer-logo">IDA Decision Intelligence</span>
            </div>
        </footer>
    </div>

    <script>
        // Toggle card expansion
        function toggleCard(id) {
            const card = document.getElementById('card-' + id);
            if (card) {
                const isExpanded = card.classList.toggle('expanded');
                const button = card.querySelector('.read-more-btn');
                const btnText = button ? button.querySelector('.btn-text') : null;
                
                if (button && btnText) {
                    btnText.textContent = isExpanded ? 'Show Less' : 'Read More';
                }
            }
        }

        // Toggle Deepdive for case studies
        function toggleDeepdive(id) {
            const content = document.getElementById(id);
            const card = content.closest('.case-study-card');
            const button = card.querySelector('.read-more-btn');
            const btnText = button.querySelector('.btn-text');
            const arrow = button.querySelector('.arrow');
            
            if (content.style.maxHeight === '0px' || content.style.maxHeight === '') {
                content.style.maxHeight = '2000px';
                content.style.opacity = '1';
                btnText.textContent = 'Hide Details';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                btnText.textContent = 'Deepdive';
                arrow.style.transform = 'rotate(0deg)';
            }
        }

        // Toggle competitor reason box
        function toggleCompReason(el) {
            const toggle = el.closest('.comp-reason-toggle');
            if (toggle) {
                toggle.classList.toggle('active');
            }
        }

        // Toggle Sources Visibility
        function toggleSources(e) {
            if(e) e.preventDefault();
            const section = document.getElementById('sources-section');
            if (section.style.display === 'none') {
                section.style.display = 'block';
                // Smooth scroll to sources
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                section.style.display = 'none';
            }
        }

        // Render Chart
        document.addEventListener('DOMContentLoaded', () => {
            const fullData = ${JSON.stringify(data).replace(/</g, '\\u003c')};
            console.log("FULL REPORT DATA:", fullData);
            const data = ${JSON.stringify(data.competitors || []).replace(/</g, '\\u003c')};
            const chartData = data.map(c => {
                const isObj = typeof c === 'object';
                return {
                    type: isObj ? c.name : c,
                    value: isObj ? c.market_share : 20
                };
            });

            const donut = new G2Plot.Pie('competitor-chart', {
                appendPadding: 10,
                data: chartData,
                angleField: 'value',
                colorField: 'type',
                radius: 0.8,
                innerRadius: 0.6,
                label: {
                    type: 'inner',
                    offset: '-50%',
                    content: '{value}%',
                    style: {
                        textAlign: 'center',
                        fontSize: 14,
                        fill: '#fff',
                    },
                },
                statistic: {
                    title: false,
                    content: {
                        style: {
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '24px',
                            color: '#fff'
                        },
                        content: 'Market\\nShare',
                    },
                },
                theme: 'dark',
                legend: {
                    position: 'bottom',
                    itemValue: {
                        style: { fill: '#fff' }
                    }
                }
            });

            donut.render();
        });
    </script>
</body>
</html>`;
};

