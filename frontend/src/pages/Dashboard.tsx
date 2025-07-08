import UrlForm from "../components/UrlForm";
import UrlTable from "../components/UrlTable";

const DashBoard = ()=>{
    return(
        <>
            <UrlForm/>
            <h2>Results</h2>
            <UrlTable/>
        </>
    )
}
export default DashBoard;