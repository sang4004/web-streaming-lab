import PageLayout from '../components/PageLayout'

const NotFoundPage = () => {
  return (
    <PageLayout title="페이지를 찾을 수 없습니다">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className="description">실습 목록에서 페이지를 선택해주세요.</p>
    </PageLayout>
  )
}

export default NotFoundPage
