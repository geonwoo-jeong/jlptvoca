# jlptvoca.com 파킹 페이지 배포 런북

- 확인일: 2026-07-14
- 배포 대상: `parking/`
- 배포 방식: 공개 GitHub 저장소 + GitHub Actions + GitHub Pages
- GitHub 소유자: `geonwoo-jeong`

## 현재 상태

- 공개 GitHub 저장소 `geonwoo-jeong/jlptvoca`의 `main`이 GitHub Actions로 배포된다.
- `jlptvoca.com` custom domain과 HTTPS가 연결되어 있다.
- 배포 artifact는 `parking/`으로 제한되며 테스트를 통과한 변경만 공개된다.

## 안전한 배포 순서

DNS를 먼저 GitHub로 변경하지 않는다. GitHub는 도메인 탈취를 막기 위해
계정의 도메인 검증과 저장소 Pages 설정을 DNS 전환보다 먼저 완료할 것을
권장한다.

1. `geonwoo-jeong` 소유의 공개 저장소를 만들고 이 저장소의 `main`을 push한다.
2. 저장소 `Settings → Pages → Build and deployment`에서 source를
   `GitHub Actions`로 선택한다.
3. GitHub 개인 설정의 `Pages → Add a domain`에서 `jlptvoca.com`을 추가하고,
   GitHub가 제시한 `_github-pages-challenge-geonwoo-jeong` TXT 레코드를
   Porkbun에 추가한 뒤 검증한다. TXT 레코드는 검증 후에도 유지한다.
4. 저장소 `Settings → Pages → Custom domain`에 `jlptvoca.com`을 저장한다.
   custom Actions workflow에서는 저장소의 `CNAME` 파일이 무시되므로 이
   설정이 정본이다.
5. Porkbun의 기존 파킹 apex A 레코드와 wildcard/forwarding 레코드를 제거한다.
6. apex `@`에 다음 GitHub Pages A 레코드 네 개를 추가한다.

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

7. `www`에 `CNAME → geonwoo-jeong.github.io`를 직접 설정한다. apex 도메인이나
   저장소 경로를 CNAME 대상으로 사용하지 않는다.
8. `github-pages` environment의 deployment branch를 `main`으로 제한한다.
9. DNS와 인증서 상태가 정상으로 바뀐 뒤 `Enforce HTTPS`를 켠다.

## 배포 확인

- Actions의 테스트 job과 Pages deploy job이 성공했는지 확인한다.
- `https://jlptvoca.com/`, `/en/`, `/vi/`, `/id/`가 모두 열리는지 확인한다.
- 루트에서 영어·베트남어·인도네시아어 브라우저 언어 감지와 저장된 수동
  선택에 따라 적합한 언어 링크가 강조되는지 확인한다. 자동 이동은 하지 않는다.
- apex와 `www` 중 Pages에 등록한 custom domain으로 리디렉션되는지 확인한다.
- HTTPS 강제, 404, 모바일 320px, 200% 확대, 키보드 focus, screen reader,
  고대비와 reduced motion을 실제 배포 URL에서 확인한다.
- `/`, `/en/`, `/vi/`, `/id/`의 self-canonical·상호 `hreflang`·검색 허용
  robots meta와 공유 metadata를 확인한다. 404만 `noindex, nofollow`여야 한다.
- `https://jlptvoca.com/sitemap.xml`이 네 canonical URL만 제공하고
  `robots.txt`가 sitemap을 선언하는지 확인한다.

## 검색엔진 등록

배포만으로 색인이 보장되지는 않는다. 도메인 소유자가 다음 외부 등록을 마쳐야 한다.

1. Google Search Console에 도메인 속성을 추가하고 DNS TXT로 소유권을 확인한다.
2. `https://jlptvoca.com/sitemap.xml`을 제출하고 네 canonical URL의 색인을 요청한다.
3. Bing Webmaster Tools에 사이트를 추가하거나 Search Console 설정을 가져온 뒤 같은 sitemap을 제출한다.
4. 출시 전후로 색인 상태, 선택된 canonical, hreflang 오류와 검색 노출 문구를 확인한다.

## 공식 근거

- [GitHub Pages 게시 source 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Custom workflow로 Pages 배포](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Custom domain 관리와 DNS 값](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Custom domain 소유권 검증](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub Pages HTTPS 강제](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
