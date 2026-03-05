export interface CourseItem {
    id: string;
    title: string;
    content: string;
}

export interface CourseSection {
    id: string;
    title: string;
    items: CourseItem[];
}

export const courseConfig: Record<string, {
    name: string;
    items: CourseItem[];
    sections?: CourseSection[];
}> = {
    basic: {
        name: 'Basic course',
        items: [
            {
                id: 'sim-orientation',
                title: '1. Basic orientation',
                content: 'Basic coure 전반에 대한 orientation 동영상입니다.',
            },
            {
                id: 'memory-training',
                title: '2. Memory Training (MT)',
                content: '진단 EGD 전과정을 암기하여 실전에 적용할 수 있도록 훈련하는 과정입니다.',
            },
            {
                id: 'scope-handling',
                title: '3. Scope Handling Training (SHT)',
                content: 'Scope의 조작과 기본 동작을 훈련하는 과정입니다.',
            },
            {
                id: 'egd-method',
                title: '4. EGD Method Training (EMT)',
                content: '앞에서 익힌 기본 술기로 실제 환자의 상부 위장관과 같은 시뮬레이터에서, 이미 암기한 검사 동작대로 실제로 해보면서 익히는 과정입니다.',
            },
        ],
    },
    'advanced-f1': {
        name: 'Advanced course for F1',
        items: [],
        sections: [
            {
                id: 'diagnostic-endoscopy',
                title: '진단 내시경',
                items: [
                    {
                        id: 'dx-egd-lecture',
                        title: '1. Dx EGD 실전 강의',
                        content: '체계적으로 구성된 진단 EGD의 기초 강의 모음입니다.',
                    },
                    {
                        id: 'egd-variation',
                        title: '2. EGD variation',
                        content: '실제 EGD 수행 초기에 겪게되는 다양한 상황에 대한 대처 방법을 알려주는 동영상 모음입니다.',
                    },
                    {
                        id: 'egd-lesion-dx',
                        title: '3. EGD lesion Dx',
                        content: '매월 업데이트되고, 기초부터 고급까지 숙련도에 따라 난이도가 차츰 상승하는 EGD 증례 사진과 해설 모음입니다.',
                    },
                    {
                        id: 'other-lectures',
                        title: '4. Other lectures',
                        content: '기타 다양한 주제의 강의 모음입니다.',
                    },
                ],
            },
            {
                id: 'therapeutic-endoscopy-basic',
                title: '치료 내시경 기초',
                items: [
                    {
                        id: 'lht',
                        title: '1. Left Hand Trainer (LHT)',
                        content: '왼손으로만 scope를 조작할 수 있도록 훈련하는 과정입니다.',
                    },
                    {
                        id: 'hemoclip',
                        title: '2. Hemoclip',
                        content: 'Hemoclip 내용이 여기에 표시됩니다.',
                    },
                    {
                        id: 'injection',
                        title: '3. Injection',
                        content: 'Injection 내용이 여기에 표시됩니다.',
                    },
                    {
                        id: 'apc',
                        title: '4. Argon plasma coagulation (APC)',
                        content: 'Argon plasma coagulation (APC) 내용이 여기에 표시됩니다.',
                    },
                    {
                        id: 'nexpowder',
                        title: '5. NexPowder',
                        content: 'NexPowder 내용이 여기에 표시됩니다.',
                    },
                    {
                        id: 'evl',
                        title: '6. EVL',
                        content: 'EVL 내용이 여기에 표시됩니다.',
                    },
                    {
                        id: 'peg',
                        title: '7. PEG',
                        content: 'PEG 내용이 여기에 표시됩니다.',
                    },
                ],
            },
            {
                id: 'therapeutic-endoscopy-clinical',
                title: '치료 내시경 임상',
                items: [
                    {
                        id: 'nvugib-lecture',
                        title: '1. NVUGIB 총론 강의',
                        content: '비정맥류 상부 위장관 출혈의 내시경적 지혈술 전반에 대한 강의입니다.',
                    },
                    {
                        id: 'nvugib-case',
                        title: '2. NVUGIB case 해설',
                        content: 'NVUGIB의 흔한 병변에 대한 다양한 지혈술의 적용을 실제 증례를 대상으로 해설하는 강의 모음입니다.',
                    },
                ],
            },
        ],
    },
    advanced: {
        name: 'Advanced course for F2',
        items: [
            {
                id: 'diagnostic-eus-lecture',
                title: '1. 진단 EUS 강의',
                content: '상부 위장관 EUS에 대한 기초와 증례 강의입니다.',
            },
            {
                id: 'egd-lesion-dx-f2',
                title: '2. EGD lesion Dx',
                content: '매월 업데이트되고, 기초부터 고급까지 숙련도에 따라 난이도가 차츰 상승하는 EGD 증례 사진과 해설 모음입니다.',
            },
            {
                id: 'problem-oriented-learning',
                title: '3. Problem-Based Learning (PBL) for F2',
                content: '상부위장관 질환 case 중에서 난이도가 높은 상황을 선택하여 증례로 구성해서 문제를 풀어가는 훈련 과정입니다.',
            },
            {
                id: 'stent-eso-ge-junction',
                title: '4. Stent Eso GE junction',
                content: '식도-위장 접합부 스텐트 시술에 대한 교육 콘텐츠입니다.',
            },
        ],
    },
    pbl: {
        name: 'PBL',
        items: [
            {
                id: 'pbl-f2-01',
                title: 'PBL_F2_01',
                content: 'stage IV AGC|stage IV AGC 환자의 검사와 치료',
            },
            {
                id: 'pbl-f2-02',
                title: 'PBL_F2_02',
                content: 'refractory GERD|refractory GERD 환자의 진단과 치료',
            },
            {
                id: 'pbl-f2-03',
                title: 'PBL_F2_03',
                content: 'GI bleeding|GI bleeding의 진단과 치료',
            },
            {
                id: 'pbl-f2-04',
                title: 'PBL_F2_04',
                content: 'non curative ESD|non-curative ESD의의 정의와 후속 과정',
            },
            {
                id: 'pbl-f2-05',
                title: 'PBL_F2_05',
                content: 'refractory FD|refractory FD 환자에서의 약물 치료',
            },
            {
                id: 'pbl-f2-06',
                title: 'PBL_F2_06',
                content: 'H.pylori 제균치료|TPL 환자에서의 H. pylori 제균치료',
            },
            {
                id: 'pbl-f2-07',
                title: 'PBL_F2_07',
                content: 'Duodenal NET|duodenal NET의 진단과 치료',
            },
            {
                id: 'pbl-f2-08',
                title: 'PBL_F2_08',
                content: 'Esophageal SET|large esophageal SET 환자의 management',
            },
            {
                id: 'pbl-f2-09',
                title: 'PBL_F2_09',
                content: 'AGC B4|AGC B4의 진단',
            },
            {
                id: 'pbl-f2-10',
                title: 'PBL_F2_10',
                content: 'Gastric MALT lymphoma|stage IE1 erosive type gastric MALT lymphoma의 long-term FU',
            },
            {
                id: 'pbl-f2-11',
                title: 'PBL_F2_11',
                content: 'Bayes theorem|Bayes theorem의 임상적 응용',
            },
            {
                id: 'pbl-f2-12',
                title: 'PBL_F2_12',
                content: 'Gastric polyposis|Gastric polyposis의 감별진단',
            },
            {
                id: 'pbl-f2-13',
                title: 'PBL_F2_13',
                content: 'Esophageal cancer staging|Esophageal cancer staging에서 LN metastasis 진단의 중요성',
            },
            {
                id: 'pbl-f2-14',
                title: 'PBL_F2_14',
                content: 'post gastrectomy dumping syndrome|post gastrectomy dumping syndrome의 진단과 management',
            },
        ],
    },
};

